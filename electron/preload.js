const { contextBridge, webUtils, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  saveFile: (filePath, buffer) =>
    ipcRenderer.invoke("save-file", { filePath, buffer }),
  // 认证相关
  loginSuccess: () => ipcRenderer.send("login-success"),
  logout: () => ipcRenderer.send("logout"),
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
});

// 添加 electron 全局对象供更新功能使用
contextBridge.exposeInMainWorld("electron", {
  // 检查更新
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  // 下载更新
  downloadUpdate: () => ipcRenderer.send("download-update"),
  // 安装更新
  quitAndInstall: () => ipcRenderer.send("quit-and-install"),
  // 监听更新状态
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (event, data) => callback(data));
  },
  // 移除更新状态监听器
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners("update-status");
  },
});
