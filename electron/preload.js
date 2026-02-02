const { contextBridge, webUtils, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  saveFile: (filePath, buffer) =>
    ipcRenderer.invoke("save-file", { filePath, buffer }),
});
