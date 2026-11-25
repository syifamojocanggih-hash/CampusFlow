/**
 * OS-Level Screen Time Tracker Utility (PRD v4.0 Modul 2)
 *
 * Melacak waktu aktif penggunaan Layar OS (seluruh aktivitas laptop lintas tab & lintas aplikasi
 * seperti VS Code, Word, PDF Reader, Browser) menggunakan:
 * 1. Sensor OS System Idle Time dari Backend (`/api/v1/os-lock/screentime` — macOS IOHIDSystem `HIDIdleTime`, Windows `GetLastInputInfo`, Linux `xprintidle`)
 * 2. Electron `powerMonitor.getSystemIdleTime()` (jika dijalankan via Electron)
 * 3. Cross-Tab Continuous Wall-Clock Fallback (tetap menghitung saat pindah tab/aplikasi selama perangkat tidak sleep/idle > 3 menit)
 */

import { useEffect, useState } from "react";

const SCREEN_TIME_KEY_PREFIX = "cf_screentime_";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const OS_IDLE_LIMIT_SECONDS = 180; // 3 menit tanpa interaksi OS = Idle

function getLocalTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${SCREEN_TIME_KEY_PREFIX}${yyyy}-${mm}-${dd}`;
}

export function formatScreenTimeHMS(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}j ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}d`;
  }
  return `${m}m ${String(s).padStart(2, "0")}d`;
}

export interface OsScreenTimeTelemetry {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  formattedHMS: string;
  osIdleSeconds: number;
  isOsActive: boolean;
  trackingMode: "OS_LEVEL" | "CROSS_APP_CONTINUOUS";
}

class ScreenTimeTracker {
  private lastTickTime: number | null = null;
  private localIntervalId: number | null = null;
  private osSyncIntervalId: number | null = null;
  private osIdleSeconds = 0;
  private isOsActive = true;
  private trackingMode: "OS_LEVEL" | "CROSS_APP_CONTINUOUS" = "OS_LEVEL";
  private listeners = new Set<(telemetry: OsScreenTimeTelemetry) => void>();

  constructor() {
    this.handleVisibilityOrFocus = this.handleVisibilityOrFocus.bind(this);
    this.tickLocal = this.tickLocal.bind(this);
    this.syncWithOsDaemon = this.syncWithOsDaemon.bind(this);
  }

  start() {
    if (typeof window === "undefined") return;
    if (this.localIntervalId !== null) return;

    this.lastTickTime = Date.now();

    // Saat kembali ke tab ini dari aplikasi lain, langsung sinkronkan waktu layar OS terbaru
    document.addEventListener("visibilitychange", this.handleVisibilityOrFocus);
    window.addEventListener("focus", this.handleVisibilityOrFocus);

    // Tick setiap 1 detik (TIDAK berhenti saat pindah tab atau pindah ke aplikasi lain di OS)
    this.localIntervalId = window.setInterval(this.tickLocal, 1000);

    // Sinkronkan dengan sensor kernel OS di backend setiap 3 detik
    void this.syncWithOsDaemon();
    this.osSyncIntervalId = window.setInterval(this.syncWithOsDaemon, 3000);
  }

  stop() {
    if (typeof window === "undefined") return;
    this.tickLocal();
    document.removeEventListener("visibilitychange", this.handleVisibilityOrFocus);
    window.removeEventListener("focus", this.handleVisibilityOrFocus);
    if (this.localIntervalId !== null) {
      clearInterval(this.localIntervalId);
      this.localIntervalId = null;
    }
    if (this.osSyncIntervalId !== null) {
      clearInterval(this.osSyncIntervalId);
      this.osSyncIntervalId = null;
    }
  }

  private handleVisibilityOrFocus() {
    // Saat user berpindah kembali ke tab web ini, hitung selisih waktu selama user bekerja di aplikasi OS lain
    this.tickLocal();
    void this.syncWithOsDaemon();
  }

  private tickLocal() {
    const now = Date.now();
    if (this.lastTickTime !== null) {
      const elapsedSeconds = Math.max(0, Math.floor((now - this.lastTickTime) / 1000));
      this.lastTickTime = now;

      // Jika selisih waktu wajar (bukan habis ditinggal sleep berjam-jam) dan OS tidak sedang idle (> 3 menit)
      if (elapsedSeconds > 0 && elapsedSeconds <= OS_IDLE_LIMIT_SECONDS && this.isOsActive) {
        this.addSecondsToToday(elapsedSeconds);
      }
    } else {
      this.lastTickTime = now;
    }
    this.notify();
  }

  private async syncWithOsDaemon() {
    const currentLocalSeconds = this.getTodayScreenTimeSeconds();

    try {
      const headers: Record<string, string> = {};
      if (typeof localStorage !== "undefined") {
        const token = localStorage.getItem("cf_auth_token");
        if (token && !token.startsWith("mock-jwt-")) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const res = await fetch(
        `${BASE_URL}/os-lock/screentime?clientSeconds=${currentLocalSeconds}`,
        { headers }
      );
      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            osActiveSeconds?: number;
            osIdleSeconds?: number;
            isOsActive?: boolean;
          };
        };
        if (json.data && typeof json.data.osActiveSeconds === "number") {
          this.trackingMode = "OS_LEVEL";
          this.osIdleSeconds = Number(json.data.osIdleSeconds ?? 0);
          this.isOsActive = Boolean(json.data.isOsActive ?? true);

          const authoritativeSeconds = Math.max(
            currentLocalSeconds,
            Math.floor(json.data.osActiveSeconds)
          );
          this.setTodaySeconds(authoritativeSeconds);
          this.notify();
          return;
        }
      }
    } catch {
      this.trackingMode = "CROSS_APP_CONTINUOUS";
    }
  }

  private setTodaySeconds(totalSeconds: number) {
    if (typeof localStorage === "undefined") return;
    const key = getLocalTodayKey();
    localStorage.setItem(key, String(Math.max(0, Math.floor(totalSeconds))));
  }

  addSecondsToToday(seconds: number) {
    if (typeof localStorage === "undefined") return;
    const key = getLocalTodayKey();
    const current = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(current + seconds));
  }

  getTodayScreenTimeSeconds(): number {
    if (typeof localStorage === "undefined") return 0;
    const key = getLocalTodayKey();
    return Math.max(0, Math.floor(Number(localStorage.getItem(key) || 0)));
  }

  getTodayScreenTimeMinutes(): number {
    return Math.floor(this.getTodayScreenTimeSeconds() / 60);
  }

  getTodayScreenTimeHours(): number {
    return Number((this.getTodayScreenTimeSeconds() / 3600).toFixed(2));
  }

  getTelemetry(): OsScreenTimeTelemetry {
    const totalSeconds = this.getTodayScreenTimeSeconds();
    return {
      totalSeconds,
      totalMinutes: Math.floor(totalSeconds / 60),
      totalHours: Number((totalSeconds / 3600).toFixed(2)),
      formattedHMS: formatScreenTimeHMS(totalSeconds),
      osIdleSeconds: this.osIdleSeconds,
      isOsActive: this.isOsActive,
      trackingMode: this.trackingMode,
    };
  }

  subscribe(listener: (telemetry: OsScreenTimeTelemetry) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getTelemetry();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const screenTimeTracker = new ScreenTimeTracker();

export function useOsScreenTime(): OsScreenTimeTelemetry {
  const [telemetry, setTelemetry] = useState<OsScreenTimeTelemetry>(() =>
    screenTimeTracker.getTelemetry()
  );

  useEffect(() => {
    setTelemetry(screenTimeTracker.getTelemetry());
    return screenTimeTracker.subscribe(setTelemetry);
  }, []);

  return telemetry;
}
