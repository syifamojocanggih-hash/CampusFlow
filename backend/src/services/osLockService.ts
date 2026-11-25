import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface OsScreenTimeState {
  dateKey: string;
  osActiveSeconds: number;
  osActiveMinutes: number;
  osActiveHours: number;
  osIdleSeconds: number;
  isOsActive: boolean;
  idleThresholdSeconds: number;
  trackingMode: "OS_LEVEL";
  platform: NodeJS.Platform;
}

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
  screenTime?: OsScreenTimeState;
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
  {
    name: "Opera",
    appPaths: ["/Applications/Opera.app"],
  },
];

const FIREFOX_PATHS = [
  "/Applications/Firefox.app",
  "/Applications/Firefox Developer Edition.app",
];

const SAFARI_PATHS = [
  "/Applications/Safari.app",
  "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app",
];

function isFirefoxInstalled(): boolean {
  return FIREFOX_PATHS.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

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

function getLocalTodayDateKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const OS_IDLE_THRESHOLD_SECONDS = 180; // 3 menit tanpa input mouse/keyboard di seluruh OS = Idle
const OS_SCREENTIME_STATE_FILE = path.resolve(
  process.cwd(),
  "node_modules",
  ".cache",
  "os-screentime.json"
);

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
  private firefoxAvailable: boolean = isFirefoxInstalled();
  private skipHostEnforcer = false;

  // OS-Level Screen Time Tracking State
  private screenTimeDateKey: string = getLocalTodayDateKey();
  private osActiveSecondsToday = 0;
  private osIdleSeconds = 0;
  private lastScreenTimeTickMs: number = Date.now();
  private lastScreenTimePersistMs = 0;
  private screenTimeInterval: ReturnType<typeof setInterval> | null = null;
  private isPollingIdle = false;

  constructor() {
    this.loadPersistedScreenTime();
    this.startScreenTimeDaemon();
  }

  private loadPersistedScreenTime(): void {
    const todayKey = getLocalTodayDateKey();
    this.screenTimeDateKey = todayKey;
    try {
      if (fs.existsSync(OS_SCREENTIME_STATE_FILE)) {
        const raw = fs.readFileSync(OS_SCREENTIME_STATE_FILE, "utf-8");
        const parsed = JSON.parse(raw) as { dateKey?: string; osActiveSeconds?: number };
        if (parsed.dateKey === todayKey && typeof parsed.osActiveSeconds === "number") {
          this.osActiveSecondsToday = Math.max(0, Math.floor(parsed.osActiveSeconds));
        }
      }
    } catch {
      // Ignore corrupt or missing local cache file
    }
  }

  private persistScreenTime(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastScreenTimePersistMs < 10_000) return;
    this.lastScreenTimePersistMs = now;
    try {
      const dir = path.dirname(OS_SCREENTIME_STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        OS_SCREENTIME_STATE_FILE,
        JSON.stringify({
          dateKey: this.screenTimeDateKey,
          osActiveSeconds: this.osActiveSecondsToday,
          updatedAt: new Date(now).toISOString(),
        }),
        "utf-8"
      );
    } catch {
      // Non-fatal
    }
  }

  startScreenTimeDaemon(): void {
    if (process.env.NODE_ENV === "test" || process.env.NODE_TEST_CONTEXT) return;
    if (this.screenTimeInterval) return;

    this.lastScreenTimeTickMs = Date.now();
    // Di Windows, PowerShell startup sedikit lebih berat sehingga interval 6 detik menjaga CPU tetap ringan
    const intervalMs = process.platform === "win32" ? 6000 : 3000;
    this.screenTimeInterval = setInterval(() => {
      void this.tickOsScreenTime();
    }, intervalMs);
  }

  private async queryOsIdleSeconds(): Promise<number> {
    try {
      if (process.platform === "darwin") {
        // Baca HIDIdleTime langsung dari kernel macOS IOHIDSystem (dalam nanodetik)
        const out = await runCommandAsync("ioreg", ["-c", "IOHIDSystem", "-d", "4"], 1200);
        const match = out.match(/"HIDIdleTime"\s*=\s*(\d+)/);
        if (match && match[1]) {
          return Math.max(0, Math.floor(Number(match[1]) / 1_000_000_000));
        }
      } else if (process.platform === "win32") {
        const ps = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class IdleTime {
  [StructLayout(LayoutKind.Sequential)]
  struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")]
  static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  public static uint GetIdleSeconds() {
    LASTINPUTINFO lii = new LASTINPUTINFO();
    lii.cbSize = (uint)Marshal.SizeOf(lii);
    GetLastInputInfo(ref lii);
    return ((uint)Environment.TickCount - lii.dwTime) / 1000;
  }
}
'@
[IdleTime]::GetIdleSeconds()
`;
        const out = await runCommandAsync(
          "powershell",
          ["-NoProfile", "-NonInteractive", "-Command", ps],
          1500
        );
        const parsed = parseInt(out, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      } else if (process.platform === "linux") {
        // Coba X11 xprintidle terlebih dahulu
        const out = await runCommandAsync("xprintidle", [], 1000);
        const parsed = parseInt(out, 10);
        if (!isNaN(parsed) && parsed >= 0) return Math.floor(parsed / 1000);

        // Fallback Wayland / GNOME Mutter IdleMonitor
        const gdbusOut = await runCommandAsync(
          "gdbus",
          [
            "call",
            "--session",
            "--dest",
            "org.gnome.Mutter.IdleMonitor",
            "--object-path",
            "/org/gnome/Mutter/IdleMonitor/Core",
            "--method",
            "org.gnome.Mutter.IdleMonitor.GetIdletime",
          ],
          1000
        );
        const match = gdbusOut.match(/(\d+)/);
        if (match && match[1]) {
          return Math.max(0, Math.floor(Number(match[1]) / 1000));
        }
      }
    } catch {
      // Fallback to 0 (active)
    }
    return 0;
  }

  private async tickOsScreenTime(): Promise<void> {
    if (this.isPollingIdle) return;
    this.isPollingIdle = true;

    try {
      const now = Date.now();
      const todayKey = getLocalTodayDateKey(new Date(now));

      if (this.screenTimeDateKey !== todayKey) {
        this.screenTimeDateKey = todayKey;
        this.osActiveSecondsToday = 0;
      }

      const elapsedSeconds = Math.max(0, Math.round((now - this.lastScreenTimeTickMs) / 1000));
      this.lastScreenTimeTickMs = now;

      const idleSec = await this.queryOsIdleSeconds();
      this.osIdleSeconds = idleSec;

      // Jika laptop tidak sedang sleep (elapsed <= 30s) dan user aktif di OS (idle < 180s)
      if (elapsedSeconds > 0 && elapsedSeconds <= 30 && idleSec < OS_IDLE_THRESHOLD_SECONDS) {
        this.osActiveSecondsToday += elapsedSeconds;
        this.persistScreenTime(false);
      }
    } finally {
      this.isPollingIdle = false;
    }
  }

  getScreenTimeState(clientSeedSeconds?: number): OsScreenTimeState {
    const todayKey = getLocalTodayDateKey();
    if (this.screenTimeDateKey !== todayKey) {
      this.screenTimeDateKey = todayKey;
      this.osActiveSecondsToday = 0;
    }

    if (
      typeof clientSeedSeconds === "number" &&
      Number.isFinite(clientSeedSeconds) &&
      clientSeedSeconds > this.osActiveSecondsToday
    ) {
      this.osActiveSecondsToday = Math.floor(clientSeedSeconds);
      this.persistScreenTime(true);
    }

    const osActiveMinutes = Math.floor(this.osActiveSecondsToday / 60);
    const osActiveHours = Number((this.osActiveSecondsToday / 3600).toFixed(2));

    return {
      dateKey: this.screenTimeDateKey,
      osActiveSeconds: this.osActiveSecondsToday,
      osActiveMinutes,
      osActiveHours,
      osIdleSeconds: this.osIdleSeconds,
      isOsActive: this.osIdleSeconds < OS_IDLE_THRESHOLD_SECONDS,
      idleThresholdSeconds: OS_IDLE_THRESHOLD_SECONDS,
      trackingMode: "OS_LEVEL",
      platform: process.platform,
    };
  }

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
      screenTime: this.getScreenTimeState(),
    };
  }

  armTimer(options: {
    durationSeconds: number;
    reason?: string;
    targetUrl?: string;
    preferredBrowser?: string;
    isMobileClient?: boolean;
  }): OsLockState {
    this.clearArmedTimer();

    const duration = Math.max(1, Math.round(options.durationSeconds));
    this.isArmed = true;
    this.armedDurationSeconds = duration;
    this.armedAt = Date.now();
    this.skipHostEnforcer = Boolean(options.isMobileClient);
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
          isMobileClient: this.skipHostEnforcer,
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
    this.skipHostEnforcer = false;
    return this.getStatus();
  }

  lockScreen(options?: {
    reason?: string;
    targetUrl?: string;
    preferredBrowser?: string;
    isMobileClient?: boolean;
  }): OsLockState {
    this.clearArmedTimer();
    this.isArmed = false;
    this.armedDurationSeconds = null;
    this.armedAt = null;
    this.skipHostEnforcer = Boolean(options?.isMobileClient);

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

    // Jika request berasal dari browser HP (Android/iOS), jangan bajak fokus layar laptop host
    if (!this.skipHostEnforcer) {
      this.startEnforcerLoop();
      void this.enforceOsFocus();
    }

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

    // Pass 2.5: Check Firefox if installed and running on macOS
    if (this.firefoxAvailable) {
      const ffPid = await runCommandAsync("pgrep", ["-x", "firefox"], 800);
      if (ffPid) {
        await runCommandAsync("osascript", ["-e", 'tell application "Firefox" to activate'], 1500);
        this.activeBrowser = "Firefox";
        return;
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
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class WinFocus {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
'@
$browserNames = @('msedge','chrome','brave','firefox','vivaldi','opera','arc')
$procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
  $_.MainWindowHandle -ne 0 -and $browserNames -contains $_.ProcessName.ToLower()
}
$target = $procs | Where-Object { $_.MainWindowTitle -like '*CampusFlow*' } | Select-Object -First 1
if (-not $target) {
  $target = $procs | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -First 1
}
if ($target) {
  $hwnd = $target.MainWindowHandle
  if ([WinFocus]::IsIconic($hwnd)) { [WinFocus]::ShowWindowAsync($hwnd, 9) | Out-Null }
  [WinFocus]::SetForegroundWindow($hwnd) | Out-Null
  $wshell = New-Object -ComObject WScript.Shell
  $wshell.AppActivate($target.Id) | Out-Null
  Write-Output $target.ProcessName
}
`.trim();
    const focused = await runCommandAsync(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-Command", psScript],
      1800
    );
    if (focused) {
      this.activeBrowser = focused;
    }
  }

  private async enforceLinuxFocus(): Promise<void> {
    const res = await runCommandAsync("wmctrl", ["-a", "CampusFlow"], 1200);
    if (!res) {
      await runCommandAsync(
        "xdotool",
        ["search", "--name", "CampusFlow", "windowactivate"],
        1200
      );
    }
  }
}

export const osLockService = new OsLockService();
