/**
 * Screen Time Tracker Utility (PRD v4.0 Modul 2)
 * Melacak waktu aktif layar mahasiswa menggunakan browser Page Visibility API (`document.hidden`)
 * dan Focus Events tanpa menyalakan webcam.
 */

const SCREEN_TIME_KEY_PREFIX = "cf_screentime_";

function getTodayKey(): string {
  const d = new Date();
  return `${SCREEN_TIME_KEY_PREFIX}${d.toISOString().split("T")[0]}`;
}

class ScreenTimeTracker {
  private activeStartTime: number | null = null;
  private intervalId: number | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    if (typeof document === "undefined") return;

    if (!document.hidden) {
      this.activeStartTime = Date.now();
    }

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("focus", this.handleVisibilityChange);
    window.addEventListener("blur", this.handleVisibilityChange);

    // Periodically save elapsed time every 30 seconds
    this.intervalId = window.setInterval(this.tick, 30_000);
  }

  stop() {
    if (typeof document === "undefined") return;
    this.tick();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("focus", this.handleVisibilityChange);
    window.removeEventListener("blur", this.handleVisibilityChange);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.tick();
      this.activeStartTime = null;
    } else {
      if (!this.activeStartTime) {
        this.activeStartTime = Date.now();
      }
    }
  }

  private tick() {
    if (this.activeStartTime) {
      const now = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((now - this.activeStartTime) / 1000));
      if (elapsedSeconds > 0) {
        this.addSecondsToToday(elapsedSeconds);
        this.activeStartTime = now;
      }
    }
  }

  addSecondsToToday(seconds: number) {
    const key = getTodayKey();
    const current = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(current + seconds));
  }

  getTodayScreenTimeMinutes(): number {
    const key = getTodayKey();
    const seconds = Number(localStorage.getItem(key) || 0);
    return Math.floor(seconds / 60);
  }

  getTodayScreenTimeHours(): number {
    return Number((this.getTodayScreenTimeMinutes() / 60).toFixed(2));
  }
}

export const screenTimeTracker = new ScreenTimeTracker();
