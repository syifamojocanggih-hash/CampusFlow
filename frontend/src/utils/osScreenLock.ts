import { useEffect, useState } from "react";
import { sound } from "@/utils/audioFeedback";

export interface OsScreenLockState {
  isLocked: boolean;
  isArmed: boolean;
  reason: string;
  remainingSeconds: number | null;
  armedDurationSeconds: number | null;
  lockedAt: string | null;
  enforcerTickCount: number;
  activeBrowser: string | null;
  isBackendConnected: boolean;
}

interface ElectronOsBridge {
  isElectron?: boolean;
  lockScreen?: (reason?: string) => Promise<void>;
  unlockScreen?: () => Promise<void>;
}

declare global {
  interface Window {
    campusFlowOS?: ElectronOsBridge;
  }
}

const STORAGE_KEY = "cf_os_lock_active";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

type Listener = (state: OsScreenLockState) => void;

class OsScreenLockController {
  private state: OsScreenLockState = {
    isLocked: false,
    isArmed: false,
    reason: "Batas Waktu Screen Time Tercapai — Wajib Peregangan Aktif",
    remainingSeconds: null,
    armedDurationSeconds: null,
    lockedAt: null,
    enforcerTickCount: 0,
    activeBrowser: null,
    isBackendConnected: false,
  };

  private listeners = new Set<Listener>();
  private armedUntilTimestamp: number | null = null;
  private localTickInterval: number | null = null;
  private statusPollInterval: number | null = null;
  private isInitialized = false;

  init() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // Restore lock if page was reloaded or reopened by OS Enforcer (?os_lock=1)
    const params = new URLSearchParams(window.location.search);
    const hasQueryLock = params.get("os_lock") === "1";
    const savedRaw = localStorage.getItem(STORAGE_KEY);

    if (hasQueryLock || savedRaw) {
      let savedReason = this.state.reason;
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (parsed?.reason) savedReason = parsed.reason;
        } catch {
          // Use default reason
        }
      }
      this.activateLocalLockState(savedReason);
    }

    this.attachBrowserGuards();
    this.startLoops();
    void this.syncWithBackend();
  }

  subscribe(listener: Listener): () => void {
    this.init();
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): OsScreenLockState {
    return this.state;
  }

  async armTimer(durationSeconds: number, reason?: string): Promise<void> {
    this.init();
    const cleanDuration = Math.max(1, Math.round(durationSeconds));
    const lockReason =
      reason ||
      `Batas Waktu Screen Time (${
        cleanDuration < 60 ? `${cleanDuration} Detik` : `${Math.round(cleanDuration / 60)} Menit`
      }) Tercapai`;

    this.armedUntilTimestamp = Date.now() + cleanDuration * 1000;
    this.updateState({
      isArmed: true,
      reason: lockReason,
      armedDurationSeconds: cleanDuration,
      remainingSeconds: cleanDuration,
    });

    try {
      const res = await fetch(`${API_BASE_URL}/os-lock/arm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: cleanDuration,
          reason: lockReason,
          targetUrl: window.location.origin,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          this.updateState({
            isBackendConnected: true,
            activeBrowser: json.data.activeBrowser ?? this.state.activeBrowser,
          });
        }
      }
    } catch {
      // Local timer continues even if backend request fails
    }
  }

  async disarmTimer(): Promise<void> {
    this.armedUntilTimestamp = null;
    this.updateState({
      isArmed: false,
      remainingSeconds: null,
      armedDurationSeconds: null,
    });

    try {
      await fetch(`${API_BASE_URL}/os-lock/disarm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore network error on disarm
    }
  }

  async triggerLock(reason?: string): Promise<void> {
    this.init();
    const lockReason = reason || this.state.reason;
    this.activateLocalLockState(lockReason);

    sound.playSlouchWarning();
    void this.requestFullscreenAndKeyboardLock();

    if (window.campusFlowOS?.lockScreen) {
      void window.campusFlowOS.lockScreen(lockReason);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/os-lock/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: lockReason,
          targetUrl: window.location.origin,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          this.updateState({
            isBackendConnected: true,
            activeBrowser: json.data.activeBrowser ?? this.state.activeBrowser,
            enforcerTickCount: json.data.enforcerTickCount ?? this.state.enforcerTickCount,
          });
        }
      }
    } catch {
      // Local lock overlay remains active
    }
  }

  async unlock(verificationSource = "POSE_CAMERA_AI"): Promise<void> {
    this.armedUntilTimestamp = null;
    localStorage.removeItem(STORAGE_KEY);

    if (typeof window !== "undefined" && window.location.search.includes("os_lock=1")) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    this.updateState({
      isLocked: false,
      isArmed: false,
      remainingSeconds: null,
      armedDurationSeconds: null,
      lockedAt: null,
    });

    void this.releaseFullscreenAndKeyboardLock();

    if (window.campusFlowOS?.unlockScreen) {
      void window.campusFlowOS.unlockScreen();
    }

    try {
      await fetch(`${API_BASE_URL}/os-lock/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationSource }),
      });
    } catch {
      // Ignore network error on unlock
    }
  }

  private activateLocalLockState(reason: string) {
    this.armedUntilTimestamp = null;
    const lockedAt = this.state.lockedAt || new Date().toISOString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isLocked: true, reason, lockedAt })
    );

    this.updateState({
      isLocked: true,
      isArmed: false,
      reason,
      remainingSeconds: 0,
      lockedAt,
    });
  }

  private updateState(partial: Partial<OsScreenLockState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private startLoops() {
    if (this.localTickInterval === null) {
      this.localTickInterval = window.setInterval(() => {
        if (this.state.isArmed && this.armedUntilTimestamp) {
          const remaining = Math.max(
            0,
            Math.ceil((this.armedUntilTimestamp - Date.now()) / 1000)
          );
          if (remaining !== this.state.remainingSeconds) {
            this.updateState({ remainingSeconds: remaining });
          }
          if (remaining <= 0) {
            void this.triggerLock(this.state.reason);
          }
        }
      }, 250);
    }

    if (this.statusPollInterval === null) {
      this.statusPollInterval = window.setInterval(() => {
        if (this.state.isArmed || this.state.isLocked) {
          void this.syncWithBackend();
        }
      }, 1000);
    }
  }

  private async syncWithBackend(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/os-lock/status`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json?.data;
      if (!data) return;

      const patch: Partial<OsScreenLockState> = {
        isBackendConnected: true,
        activeBrowser: data.activeBrowser ?? this.state.activeBrowser,
        enforcerTickCount: data.enforcerTickCount ?? this.state.enforcerTickCount,
      };

      if (data.isLocked && !this.state.isLocked) {
        this.activateLocalLockState(data.reason || this.state.reason);
        sound.playSlouchWarning();
        void this.requestFullscreenAndKeyboardLock();
      } else if (!data.isLocked && this.state.isLocked && localStorage.getItem(STORAGE_KEY)) {
        // Re-assert lock to backend if backend restarted while frontend was locked
        void fetch(`${API_BASE_URL}/os-lock/lock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: this.state.reason,
            targetUrl: window.location.origin,
          }),
        }).catch(() => {});
      }

      this.updateState(patch);
    } catch {
      this.updateState({ isBackendConnected: false });
    }
  }

  private async requestFullscreenAndKeyboardLock(): Promise<void> {
    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen requires user interaction in some browsers; retried on click/keydown
    }

    try {
      const navWithKeyboard = navigator as Navigator & {
        keyboard?: { lock?: (keys?: string[]) => Promise<void> };
      };
      if (navWithKeyboard.keyboard?.lock) {
        await navWithKeyboard.keyboard.lock([
          "Escape",
          "F11",
          "Tab",
          "MetaLeft",
          "MetaRight",
          "AltLeft",
          "AltRight",
        ]);
      }
    } catch {
      // Keyboard lock is optional enhancement in Chromium
    }
  }

  private async releaseFullscreenAndKeyboardLock(): Promise<void> {
    if (typeof document === "undefined") return;
    try {
      const navWithKeyboard = navigator as Navigator & {
        keyboard?: { unlock?: () => void };
      };
      navWithKeyboard.keyboard?.unlock?.();
    } catch {
      // Ignore
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore
    }
  }

  private attachBrowserGuards() {
    window.addEventListener("beforeunload", (e) => {
      if (this.state.isLocked) {
        e.preventDefault();
        e.returnValue = "Selesaikan prosedur peregangan aktif terlebih dahulu.";
      }
    });

    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.state.isLocked) return;

        // Re-assert fullscreen on any key press
        if (!document.fullscreenElement) {
          void this.requestFullscreenAndKeyboardLock();
        }

        const blockedKeys = ["Escape", "F11", "F5"];
        const isCloseOrSwitchCombo =
          (e.metaKey || e.ctrlKey || e.altKey) &&
          ["w", "q", "t", "n", "h", "m", "r", "Tab", "F4"].includes(e.key);

        if (blockedKeys.includes(e.key) || isCloseOrSwitchCombo) {
          e.preventDefault();
          e.stopPropagation();
          sound.playSlouchWarning();
        }
      },
      true
    );

    window.addEventListener(
      "click",
      () => {
        if (this.state.isLocked && !document.fullscreenElement) {
          void this.requestFullscreenAndKeyboardLock();
        }
      },
      true
    );

    document.addEventListener("fullscreenchange", () => {
      if (this.state.isLocked && !document.fullscreenElement) {
        sound.playSlouchWarning();
      }
    });

    const handleFocusLostWhileLocked = () => {
      if (!this.state.isLocked) return;
      sound.playSlouchWarning();
      window.focus();
      void fetch(`${API_BASE_URL}/os-lock/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: this.state.reason,
          targetUrl: window.location.origin,
        }),
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        handleFocusLostWhileLocked();
      }
    });

    window.addEventListener("blur", () => {
      handleFocusLostWhileLocked();
    });
  }
}

export const osScreenLock = new OsScreenLockController();

export function useOsScreenLock(): OsScreenLockState {
  const [state, setState] = useState<OsScreenLockState>(() => osScreenLock.getState());

  useEffect(() => {
    return osScreenLock.subscribe(setState);
  }, []);

  return state;
}

