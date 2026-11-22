const { app, BrowserWindow, ipcMain, globalShortcut, session, powerMonitor } = require("electron");
const path = require("node:path");

let mainWindow = null;
let isScreenLocked = false;
let sleepPowerState = {
  lastSuspendAt: null,
  lastResumeAt: null,
  lastLockScreenAt: null,
  lastUnlockScreenAt: null,
};

const FRONTEND_URL = process.env.CAMPUSFLOW_FRONTEND_URL || "http://localhost:5174";

function applyWindowLockState(win, locked) {
  if (!win || win.isDestroyed()) return;

  if (locked) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    app.focus({ steal: true });

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, "screen-saver");
    win.setFullScreen(true);
    win.setKiosk(true);
    win.setClosable(false);
    win.setMinimizable(false);

    try {
      globalShortcut.register("CommandOrControl+W", () => {});
      globalShortcut.register("CommandOrControl+Q", () => {});
      globalShortcut.register("CommandOrControl+H", () => {});
      globalShortcut.register("CommandOrControl+M", () => {});
      globalShortcut.register("Alt+F4", () => {});
    } catch {
      // Shortcut registration is best-effort per OS policy
    }
  } else {
    globalShortcut.unregisterAll();
    win.setKiosk(false);
    win.setFullScreen(false);
    win.setAlwaysOnTop(false);
    win.setVisibleOnAllWorkspaces(false);
    win.setClosable(true);
    win.setMinimizable(true);
  }
}

function createMainWindow() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ["media", "notifications", "fullscreen", "keyboardLock"];
    callback(allowed.includes(permission));
  });

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "CampusFlow — Active Wellbeing Workstation",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.loadURL(FRONTEND_URL);

  mainWindow.on("close", (e) => {
    if (isScreenLocked) {
      e.preventDefault();
      applyWindowLockState(mainWindow, true);
    }
  });

  mainWindow.on("blur", () => {
    if (isScreenLocked && mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (isScreenLocked && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
          app.focus({ steal: true });
        }
      }, 100);
    }
  });
}

ipcMain.handle("os-lock:lock", () => {
  isScreenLocked = true;
  applyWindowLockState(mainWindow, true);
  return { isLocked: true };
});

ipcMain.handle("os-lock:unlock", () => {
  isScreenLocked = false;
  applyWindowLockState(mainWindow, false);
  return { isLocked: false };
});

ipcMain.handle("os-lock:status", () => {
  return { isLocked: isScreenLocked };
});

ipcMain.handle("os-sleep:get-state", () => {
  let systemIdleSeconds = 0;
  try {
    systemIdleSeconds = powerMonitor.getSystemIdleTime();
  } catch {
    systemIdleSeconds = 0;
  }
  return {
    ...sleepPowerState,
    systemIdleSeconds,
  };
});

function setupPowerMonitor() {
  try {
    powerMonitor.on("suspend", () => {
      sleepPowerState.lastSuspendAt = Date.now();
    });

    powerMonitor.on("lock-screen", () => {
      sleepPowerState.lastLockScreenAt = Date.now();
    });

    const handleWakeEvent = (wakeTrigger) => {
      const now = Date.now();
      if (wakeTrigger === "resume") {
        sleepPowerState.lastResumeAt = now;
      } else {
        sleepPowerState.lastUnlockScreenAt = now;
      }

      const sleepStartTs =
        sleepPowerState.lastSuspendAt || sleepPowerState.lastLockScreenAt;
      if (sleepStartTs && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("os-sleep:wake-event", {
          sleepStartTs,
          wakeTs: now,
          source: "OS_POWER_MONITOR",
        });
      }
    };

    powerMonitor.on("resume", () => handleWakeEvent("resume"));
    powerMonitor.on("unlock-screen", () => handleWakeEvent("unlock-screen"));
  } catch {
    // Power monitor hooks are best-effort depending on OS lifecycle
  }
}

app.whenReady().then(() => {
  createMainWindow();
  setupPowerMonitor();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isScreenLocked && process.platform !== "darwin") {
    app.quit();
  }
});

