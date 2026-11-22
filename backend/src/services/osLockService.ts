import { execFile } from "node:child_process";
import fs from "node:fs";

export interface OsLockState {
  isLocked: boolean;
  isArmed: boolean;
  reason: string;
  lockedAt: string | null;
  targetUrl: string;
  armedDurationSeconds: number | null;
  armedAt: number | null;
  remainingSeconds: number | null;
  enforcerTickCount: number;
  platform: NodeJS.Platform;
  activeBrowser: string | null;
  lastUnlockSource: string | null;
  lastUnlockedAt: string | null;
}

const CHROMIUM_BROWSERS: Array<{ name: string; appPaths: string[] }> = [
  {
    name: "Brave Browser",
    appPaths: ["/Applications/Brave Browser.app"],
  },
  {
    name: "Google Chrome",
    appPaths: ["/Applications/Google Chrome.app"],
  },
  {
    name: "Microsoft Edge",
    appPaths: ["/Applications/Microsoft Edge.app"],
  },
  {
    name: "Arc",
    appPaths: ["/Applications/Arc.app"],
  },
  {
    name: "Vivaldi",
    appPaths: ["/Applications/Vivaldi.app"],
  },
];

const SAFARI_PATHS = [
  "/Applications/Safari.app",
  "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app",
];

function detectInstalledChromiumBrowsers(): string[] {
  return CHROMIUM_BROWSERS.filter((b) =>
    b.appPaths.some((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    })
  ).map((b) => b.name);
}

function isSafariInstalled(): boolean {
  return SAFARI_PATHS.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

function runCommandAsync(cmd: string, args: string[], timeoutMs = 2000): Promise<string> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs }, (err, stdout) => {
      if (err) {
        resolve("");
        return;
      }
      resolve((stdout || "").trim());
    });
  });
}

class OsLockService {
  private isLocked = false;
  private isArmed = false;
  private reason = "Batas Waktu Screen Time Tercapai — Wajib Peregangan Aktif";
  private lockedAt: string | null = null;
  private targetUrl = "http://localhost:5174";
  private armedDurationSeconds: number | null = null;
  private armedAt: number | null = null;
  private enforcerTickCount = 0;
  private activeBrowser: string | null = null;
  private lastUnlockSource: string | null = null;
  private lastUnlockedAt: string | null = null;

  private enforcerInterval: ReturnType<typeof setInterval> | null = null;
  private armedTimeout: ReturnType<typeof setTimeout> | null = null;
  private isEnforcing = false;

  private installedChromiumBrowsers: string[] = detectInstalledChromiumBrowsers();
  private safariAvailable: boolean = isSafariInstalled();

  getStatus(): OsLockState {
    let remainingSeconds: number | null = null;
    if (this.isArmed && this.armedAt && this.armedDurationSeconds) {
      const elapsed = Math.floor((Date.now() - this.armedAt) / 1000);
      remainingSeconds = Math.max(0, this.armedDurationSeconds - elapsed);
    } else if (this.isLocked) {
      remainingSeconds = 0;
    }

    return {
      isLocked: this.isLocked,
      isArmed: this.isArmed,
      reason: this.reason,
      lockedAt: this.lockedAt,
      targetUrl: this.targetUrl,
      armedDurationSeconds: this.armedDurationSeconds,
      armedAt: this.armedAt,
      remainingSeconds,
      enforcerTickCount: this.enforcerTickCount,
      platform: process.platform,
      activeBrowser: this.activeBrowser,
      lastUnlockSource: this.lastUnlockSource,
      lastUnlockedAt: this.lastUnlockedAt,
    };
  }

  armTimer(options: {
    durationSeconds: number;
    reason?: string;
    targetUrl?: string;
    preferredBrowser?: string;
  }): OsLockState {
    this.clearArmedTimer();

    const duration = Math.max(1, Math.round(options.durationSeconds));
    this.isArmed = true;
    this.armedDurationSeconds = duration;
    this.armedAt = Date.now();
    if (options.reason) {
      this.reason = options.reason;
    }
    if (options.targetUrl) {
      this.targetUrl = this.sanitizeTargetUrl(options.targetUrl);
    }
    if (options.preferredBrowser) {
      this.activeBrowser = options.preferredBrowser;
    }

    this.armedTimeout = setTimeout(() => {
      this.armedTimeout = null;
      if (this.isArmed) {
        this.lockScreen({
          reason: this.reason,
          targetUrl: this.targetUrl,
          preferredBrowser: this.activeBrowser || undefined,
        });
      }
    }, duration * 1000);

    return this.getStatus();
  }

  disarmTimer(): OsLockState {
    this.clearArmedTimer();
    this.isArmed = false;
    this.armedDurationSeconds = null;
    this.armedAt = null;
    return this.getStatus();
  }

  lockScreen(options?: {
    reason?: string;
    targetUrl?: string;
    preferredBrowser?: string;
  }): OsLockState {
    this.clearArmedTimer();
    this.isArmed = false;
    this.armedDurationSeconds = null;
    this.armedAt = null;

    if (options?.reason) {
      this.reason = options.reason;
    }
    if (options?.targetUrl) {
      this.targetUrl = this.sanitizeTargetUrl(options.targetUrl);
    }
    if (options?.preferredBrowser) {
      this.activeBrowser = options.preferredBrowser;
    }

    if (!this.isLocked) {
      this.isLocked = true;
      this.lockedAt = new Date().toISOString();
      this.enforcerTickCount = 0;
    }

    this.startEnforcerLoop();
    void this.enforceOsFocus();

    return this.getStatus();
  }

  unlockScreen(verificationSource = "POSE_CAMERA_AI"): OsLockState {
    this.clearArmedTimer();
    this.stopEnforcerLoop();

    this.isLocked = false;
    this.isArmed = false;
    this.lockedAt = null;
    this.armedDurationSeconds = null;
    this.armedAt = null;
    this.lastUnlockSource = verificationSource;
    this.lastUnlockedAt = new Date().toISOString();

    return this.getStatus();
  }

  private sanitizeTargetUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // Fallback to default local frontend URL
    }
    return "http://localhost:5174";
  }

  private clearArmedTimer(): void {
    if (this.armedTimeout) {
      clearTimeout(this.armedTimeout);
      this.armedTimeout = null;
    }
  }

  private startEnforcerLoop(): void {
    this.stopEnforcerLoop();
    this.enforcerInterval = setInterval(() => {
      if (!this.isLocked) {
        this.stopEnforcerLoop();
        return;
      }
      void this.enforceOsFocus();
    }, 500);
  }

  private stopEnforcerLoop(): void {
    if (this.enforcerInterval) {
      clearInterval(this.enforcerInterval);
      this.enforcerInterval = null;
    }
  }

  private async enforceOsFocus(): Promise<void> {
    if (!this.isLocked || this.isEnforcing) return;
    if (process.env.NODE_ENV === "test" || process.env.NODE_TEST_CONTEXT) return;

    this.isEnforcing = true;
    this.enforcerTickCount += 1;

    try {
      if (process.platform === "darwin") {
        await this.enforceMacOsFocus();
      } else if (process.platform === "win32") {
        await this.enforceWindowsFocus();
      } else if (process.platform === "linux") {
        await this.enforceLinuxFocus();
      }
    } catch {
      // Ignore transient OS script errors so the loop continues reliably
    } finally {
      this.isEnforcing = false;
    }
  }

  private async resolveRunningMacBrowsers(): Promise<string[]> {
    const running: string[] = [];
    for (const browserName of this.installedChromiumBrowsers) {
      const pid = await runCommandAsync("pgrep", ["-x", browserName], 800);
      if (pid) {
        running.push(browserName);
      }
    }

    if (this.activeBrowser && running.includes(this.activeBrowser)) {
      return [
        this.activeBrowser,
        ...running.filter((b) => b !== this.activeBrowser),
      ];
    }

    if (running.length > 0) {
      return running;
    }

    if (this.installedChromiumBrowsers.length > 0) {
      return [this.installedChromiumBrowsers[0]];
    }

    return [];
  }

  private buildChromiumAppleScript(browserName: string, reopenIfMissing: boolean): string {
    const reopenUrl = `${this.targetUrl}/?os_lock=1`;
    let hostPattern = "localhost:5174";
    try {
      hostPattern = new URL(this.targetUrl).host;
    } catch {
      hostPattern = "localhost:5174";
    }

    return `
tell application "${browserName}"
  activate
  if (count of windows) is 0 then
    ${
      reopenIfMissing
        ? `make new window
    set URL of active tab of front window to "${reopenUrl}"
    return "REOPENED_WINDOW"`
        : `return "NO_WINDOW"`
    }
  end if

  try
    set frontUrl to URL of active tab of front window
    set frontTitle to title of active tab of front window
    if (frontUrl contains "${hostPattern}" or frontUrl contains "localhost:5174" or frontUrl contains "localhost:5173" or frontTitle contains "CampusFlow") then
      if minimized of front window is true then
        set minimized of front window to false
      end if
      return "ALREADY_FOCUSED"
    end if
  end try

  repeat with w in (every window)
    set tabIdx to 1
    repeat with t in (every tab of w)
      set tUrl to URL of t
      set tTitle to title of t
      if (tUrl contains "${hostPattern}" or tUrl contains "localhost:5174" or tUrl contains "localhost:5173" or tTitle contains "CampusFlow") then
        if minimized of w is true then
          set minimized of w to false
        end if
        if active tab index of w is not tabIdx then
          set active tab index of w to tabIdx
        end if
        if index of w is not 1 then
          set index of w to 1
        end if
        activate
        return "SWITCHED_TAB"
      end if
      set tabIdx to tabIdx + 1
    end repeat
  end repeat

  ${
    reopenIfMissing
      ? `if minimized of front window is true then
    set minimized of front window to false
  end if
  tell front window
    make new tab at end of tabs with properties {URL:"${reopenUrl}"}
  end tell
  activate
  return "REOPENED_TAB"`
      : `return "NOT_FOUND"`
  }
end tell
`.trim();
  }

  private buildSafariAppleScript(reopenIfMissing: boolean): string {
    const reopenUrl = `${this.targetUrl}/?os_lock=1`;
    let hostPattern = "localhost:5174";
    try {
      hostPattern = new URL(this.targetUrl).host;
    } catch {
      hostPattern = "localhost:5174";
    }

    return `
tell application "Safari"
  activate
  if (count of windows) is 0 then
    ${
      reopenIfMissing
        ? `make new document with properties {URL:"${reopenUrl}"}
    return "REOPENED_WINDOW"`
        : `return "NO_WINDOW"`
    }
  end if

  repeat with w in (every window)
    repeat with t in (every tab of w)
      set tUrl to URL of t
      set tName to name of t
      if (tUrl contains "${hostPattern}" or tUrl contains "localhost:5174" or tUrl contains "localhost:5173" or tName contains "CampusFlow") then
        if miniaturized of w is true then
          set miniaturized of w to false
        end if
        set current tab of w to t
        set index of w to 1
        activate
        return "SWITCHED_TAB"
      end if
    end repeat
  end repeat

  ${
    reopenIfMissing
      ? `tell front window
    set newTab to make new tab with properties {URL:"${reopenUrl}"}
    set current tab to newTab
  end tell
  activate
  return "REOPENED_TAB"`
      : `return "NOT_FOUND"`
  }
end tell
`.trim();
  }

  private async enforceMacOsFocus(): Promise<void> {
    const candidates = await this.resolveRunningMacBrowsers();

    // Pass 1: Look for an existing CampusFlow tab in running Chromium browsers
    for (const browserName of candidates) {
      const script = this.buildChromiumAppleScript(browserName, candidates.length === 1);
      const result = await runCommandAsync("osascript", ["-e", script], 1800);
      if (
        result === "ALREADY_FOCUSED" ||
        result === "SWITCHED_TAB" ||
        result === "REOPENED_TAB" ||
        result === "REOPENED_WINDOW"
      ) {
        this.activeBrowser = browserName;
        return;
      }
    }

    // Pass 2: Check Safari if installed and running
    if (this.safariAvailable) {
      const safariPid = await runCommandAsync("pgrep", ["-x", "Safari"], 800);
      if (safariPid) {
        const safariResult = await runCommandAsync(
          "osascript",
          ["-e", this.buildSafariAppleScript(candidates.length === 0)],
          1800
        );
        if (
          safariResult === "SWITCHED_TAB" ||
          safariResult === "REOPENED_TAB" ||
          safariResult === "REOPENED_WINDOW"
        ) {
          this.activeBrowser = "Safari";
          return;
        }
      }
    }

    // Pass 3: Reopen tab in primary candidate browser if user closed the tab
    if (candidates.length > 0) {
      const primary = candidates[0];
      const script = this.buildChromiumAppleScript(primary, true);
      await runCommandAsync("osascript", ["-e", script], 1800);
      this.activeBrowser = primary;
    }
  }

  private async enforceWindowsFocus(): Promise<void> {
    const psScript = `
$wshell = New-Object -ComObject WScript.Shell
if (-not $wshell.AppActivate('CampusFlow')) {
  if (-not $wshell.AppActivate('Brave')) {
    if (-not $wshell.AppActivate('Chrome')) {
      $wshell.AppActivate('Edge') | Out-Null
    }
  }
}
`.trim();
    await runCommandAsync("powershell", ["-NoProfile", "-Command", psScript], 1800);
  }

  private async enforceLinuxFocus(): Promise<void> {
    await runCommandAsync("wmctrl", ["-a", "CampusFlow"], 1200);
  }
}

export const osLockService = new OsLockService();
