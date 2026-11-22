/**
 * Automatic Passive Sleep Tracker (PRD v4.0 — 24-Hour Movement Triad & Burnout Recovery)
 */

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { screenTimeTracker } from "@/utils/screenTimeTracker";
import type { AutoSleepRecordDTO, SleepDetectionSource } from "@/types";
import {
  computeAutoSleepFromWindow,
  formatTimeHHMM,
  getLocalTodayDateString,
  parseHHMMToTimestamps,
} from "@/utils/autoSleepCalculator";

export {
  calculateSleepRecoveryPoints,
  classifySleepClinicalStatus,
  computeAutoSleepFromWindow,
  formatTimeHHMM,
  getLocalTodayDateString,
  getSleepClinicalMeta,
  getSleepSourceLabel,
  inferSleepQualityScore,
  parseHHMMToTimestamps,
} from "@/utils/autoSleepCalculator";

const LAST_ACTIVE_TS_KEY = "cf_sleep_last_active_ts";
const AUTO_SLEEP_RECORD_PREFIX = "cf_auto_sleep_record_";

interface ElectronSleepBridge {
  isElectron?: boolean;
  getSleepPowerState?: () => Promise<{
    lastSuspendAt: number | null;
    lastResumeAt: number | null;
    lastLockScreenAt: number | null;
    lastUnlockScreenAt: number | null;
    systemIdleSeconds: number;
  }>;
  onWakeEvent?: (
    callback: (payload: {
      sleepStartTs: number;
      wakeTs: number;
      source: SleepDetectionSource;
    }) => void
  ) => () => void;
}

class AutoSleepTracker {
  private record: AutoSleepRecordDTO;
  private listeners = new Set<(record: AutoSleepRecordDTO) => void>();
  private isStarted = false;
  private lastActivityWriteMs = 0;
  private cleanupElectronListener: (() => void) | null = null;

  constructor() {
    this.record = this.loadOrDetectInitialRecord();
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.handleVisibilityOrWake = this.handleVisibilityOrWake.bind(this);
  }

  private getTodayStorageKey(dateStr = getLocalTodayDateString()): string {
    return `${AUTO_SLEEP_RECORD_PREFIX}${dateStr}`;
  }

  private loadOrDetectInitialRecord(): AutoSleepRecordDTO {
    const todayStr = getLocalTodayDateString();
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return computeAutoSleepFromWindow({ logDate: todayStr });
    }

    const savedJson = localStorage.getItem(this.getTodayStorageKey(todayStr));
    if (savedJson) {
      try {
        const parsed = JSON.parse(savedJson) as AutoSleepRecordDTO;
        if (parsed && typeof parsed.sleepHours === "number" && parsed.logDate === todayStr) {
          return parsed;
        }
      } catch {
        // fallback to fresh detection
      }
    }

    const now = Date.now();
    const lastActiveRaw = Number(localStorage.getItem(LAST_ACTIVE_TS_KEY) || 0);
    if (lastActiveRaw > 0 && now > lastActiveRaw) {
      const gapHours = (now - lastActiveRaw) / 3_600_000;
      if (gapHours >= 2.5 && gapHours <= 14.5) {
        const detected = computeAutoSleepFromWindow({
          logDate: todayStr,
          lastActiveTimestamp: lastActiveRaw,
          firstWakeTimestamp: now,
          sleepLatencyMins: 15,
          source: "OVERNIGHT_INACTIVITY",
        });
        this.persistRecordLocally(detected);
        return detected;
      }
    }

    const initialDetected = computeAutoSleepFromWindow({
      logDate: todayStr,
      bedTime: "23:15",
      wakeTime: "06:45",
      sleepLatencyMins: 15,
      source: "OVERNIGHT_INACTIVITY",
    });
    this.persistRecordLocally(initialDetected);
    return initialDetected;
  }

  private persistRecordLocally(rec: AutoSleepRecordDTO) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.getTodayStorageKey(rec.logDate), JSON.stringify(rec));
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.record);
    }
  }

  start() {
    if (typeof window === "undefined" || this.isStarted) return;
    this.isStarted = true;

    this.evaluateOvernightGap(Date.now());
    void this.syncWithBackend(this.record);

    window.addEventListener("pointerdown", this.handleUserActivity, { passive: true });
    window.addEventListener("keydown", this.handleUserActivity, { passive: true });
    window.addEventListener("mousemove", this.handleUserActivity, { passive: true });
    window.addEventListener("focus", this.handleVisibilityOrWake);
    document.addEventListener("visibilitychange", this.handleVisibilityOrWake);

    const bridge = (window as unknown as { campusFlowOS?: ElectronSleepBridge }).campusFlowOS;
    if (bridge?.onWakeEvent) {
      this.cleanupElectronListener = bridge.onWakeEvent((payload) => {
        const gapHours = (payload.wakeTs - payload.sleepStartTs) / 3_600_000;
        if (gapHours >= 2.0 && gapHours <= 15.0) {
          const updated = computeAutoSleepFromWindow({
            logDate: getLocalTodayDateString(),
            lastActiveTimestamp: payload.sleepStartTs,
            firstWakeTimestamp: payload.wakeTs,
            sleepLatencyMins: 5,
            source: "OS_POWER_MONITOR",
          });
          this.setRecord(updated, true);
        }
      });
    }

    if (bridge?.getSleepPowerState) {
      void bridge
        .getSleepPowerState()
        .then((state) => {
          const sleepStart = state.lastSuspendAt || state.lastLockScreenAt;
          const wakeEnd = state.lastResumeAt || state.lastUnlockScreenAt;
          if (sleepStart && wakeEnd && wakeEnd > sleepStart) {
            const gapHours = (wakeEnd - sleepStart) / 3_600_000;
            if (gapHours >= 2.0 && gapHours <= 15.0 && !this.record.isConfirmed) {
              const updated = computeAutoSleepFromWindow({
                logDate: getLocalTodayDateString(),
                lastActiveTimestamp: sleepStart,
                firstWakeTimestamp: wakeEnd,
                sleepLatencyMins: 5,
                source: "OS_POWER_MONITOR",
              });
              this.setRecord(updated, true);
            }
          }
        })
        .catch(() => {});
    }
  }

  stop() {
    if (typeof window === "undefined" || !this.isStarted) return;
    this.isStarted = false;
    window.removeEventListener("pointerdown", this.handleUserActivity);
    window.removeEventListener("keydown", this.handleUserActivity);
    window.removeEventListener("mousemove", this.handleUserActivity);
    window.removeEventListener("focus", this.handleVisibilityOrWake);
    document.removeEventListener("visibilitychange", this.handleVisibilityOrWake);
    if (this.cleanupElectronListener) {
      this.cleanupElectronListener();
      this.cleanupElectronListener = null;
    }
  }

  private handleUserActivity() {
    const now = Date.now();
    if (now - this.lastActivityWriteMs < 15_000) return;

    this.evaluateOvernightGap(now);
    this.lastActivityWriteMs = now;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_ACTIVE_TS_KEY, String(now));
    }
  }

  private handleVisibilityOrWake() {
    if (typeof document !== "undefined" && document.hidden) {
      const now = Date.now();
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LAST_ACTIVE_TS_KEY, String(now));
      }
      return;
    }
    const now = Date.now();
    this.evaluateOvernightGap(now);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_ACTIVE_TS_KEY, String(now));
    }
  }

  private evaluateOvernightGap(nowMs: number) {
    if (typeof localStorage === "undefined") return;
    const lastActiveRaw = Number(localStorage.getItem(LAST_ACTIVE_TS_KEY) || 0);
    if (!lastActiveRaw || nowMs <= lastActiveRaw) return;

    const gapHours = (nowMs - lastActiveRaw) / 3_600_000;
    const todayStr = getLocalTodayDateString(new Date(nowMs));

    if (gapHours >= 2.5 && gapHours <= 15.0) {
      if (this.record.logDate !== todayStr || !this.record.isConfirmed) {
        const detected = computeAutoSleepFromWindow({
          logDate: todayStr,
          lastActiveTimestamp: lastActiveRaw,
          firstWakeTimestamp: nowMs,
          sleepLatencyMins: 15,
          source: "OVERNIGHT_INACTIVITY",
        });
        this.setRecord(detected, true);
      }
    }
  }

  private setRecord(next: AutoSleepRecordDTO, shouldSyncBackend = true) {
    this.record = next;
    this.persistRecordLocally(next);
    this.notify();
    if (shouldSyncBackend) {
      void this.syncWithBackend(next);
    }
  }

  private async syncWithBackend(rec: AutoSleepRecordDTO) {
    try {
      await api.syncAutoSleep({
        logDate: rec.logDate,
        lastActiveTimestamp: rec.lastActiveTimestamp,
        firstWakeTimestamp: rec.firstWakeTimestamp,
        bedTime: rec.bedTime,
        wakeTime: rec.wakeTime,
        sleepHours: rec.sleepHours,
        sleepLatencyMins: rec.sleepLatencyMins,
        source: rec.source,
        isConfirmed: rec.isConfirmed,
      });

      const screenMins = screenTimeTracker.getTodayScreenTimeMinutes();
      await api.calculateBurnout({
        logDate: rec.logDate,
        totalScreenTimeMins: screenMins > 0 ? screenMins : 324,
        sleepHours: rec.sleepHours,
      });
    } catch {
      // Offline-first fallback
    }
  }

  getRecord(): AutoSleepRecordDTO {
    return this.record;
  }

  async simulateSleepWindow(
    bedTime: string,
    wakeTime: string,
    source: SleepDetectionSource = "OVERNIGHT_INACTIVITY",
    sleepLatencyMins = 15
  ): Promise<AutoSleepRecordDTO> {
    const todayStr = getLocalTodayDateString();
    const simulated = computeAutoSleepFromWindow({
      logDate: todayStr,
      bedTime,
      wakeTime,
      sleepLatencyMins,
      source,
      isConfirmed: true,
    });
    this.setRecord(simulated, true);
    return simulated;
  }

  async overrideSleepHours(sleepHours: number): Promise<AutoSleepRecordDTO> {
    const todayStr = getLocalTodayDateString();
    const clamped = Number(Math.min(16, Math.max(0.5, sleepHours)).toFixed(1));
    const wakeAnchor = parseHHMMToTimestamps("23:00", this.record.wakeTime || "06:45", todayStr);
    const firstWakeTimestamp = wakeAnchor.firstWakeTimestamp;
    const lastActiveTimestamp = firstWakeTimestamp - clamped * 3_600_000;

    const updated = computeAutoSleepFromWindow({
      logDate: todayStr,
      lastActiveTimestamp,
      firstWakeTimestamp,
      bedTime: formatTimeHHMM(lastActiveTimestamp),
      wakeTime: formatTimeHHMM(firstWakeTimestamp),
      sleepHours: clamped,
      sleepLatencyMins: 0,
      source: "MANUAL_OVERRIDE",
      isConfirmed: true,
    });
    this.setRecord(updated, true);
    return updated;
  }

  subscribe(listener: (record: AutoSleepRecordDTO) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const autoSleepTracker = new AutoSleepTracker();

export function useAutoSleep(): AutoSleepRecordDTO {
  const [record, setRecord] = useState<AutoSleepRecordDTO>(() => autoSleepTracker.getRecord());

  useEffect(() => {
    setRecord(autoSleepTracker.getRecord());
    return autoSleepTracker.subscribe(setRecord);
  }, []);

  return record;
}
