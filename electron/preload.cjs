const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("campusFlowOS", {
  isElectron: true,
  lockScreen: (reason) => ipcRenderer.invoke("os-lock:lock", reason),
  unlockScreen: () => ipcRenderer.invoke("os-lock:unlock"),
  getStatus: () => ipcRenderer.invoke("os-lock:status"),
  getSleepPowerState: () => ipcRenderer.invoke("os-sleep:get-state"),
  onWakeEvent: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("os-sleep:wake-event", listener);
    return () => ipcRenderer.removeListener("os-sleep:wake-event", listener);
  },
});


