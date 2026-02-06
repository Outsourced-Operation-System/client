const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");
const fs = require("fs");

const NODE_ENV = process.env.NODE_ENV;

// 配置日志
log.transports.file.level = "info";
autoUpdater.logger = log;

let mainWindow = null;
let loginWindow = null;

// 处理保存文件对话框
ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// 处理保存文件
ipcMain.handle("save-file", async (event, { filePath, buffer }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 检查是否已登录（检查 localStorage 中是否有 token）
function checkLoginStatus(win) {
  return new Promise((resolve) => {
    win.webContents
      .executeJavaScript('localStorage.getItem("token")')
      .then((token) => resolve(!!token))
      .catch(() => resolve(false));
  });
}

// 创建登录窗口
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 396,
    height: 540,
    resizable: false,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 登录窗口使用 hash 路由直接跳转到登录页
  if (NODE_ENV === "development") {
    loginWindow.loadURL("http://localhost:5173/#/login");
  } else {
    loginWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/login",
    });
  }

  loginWindow.on("closed", () => {
    loginWindow = null;
    // 如果登录窗口关闭且主窗口不存在，退出应用
    if (!mainWindow) {
      app.quit();
    }
  });
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 窗口创建后检查更新
  if (NODE_ENV !== "development") {
    checkForUpdates();
  }
}

// 自动更新逻辑
function checkForUpdates() {
  // 仅在生产环境检查更新
  if (NODE_ENV === "development") {
    return;
  }

  // 只检查更新，不自动通知下载
  autoUpdater.checkForUpdates();
}

// 监听更新事件
autoUpdater.on("checking-for-update", () => {
  log.info("正在检查更新...");
  sendUpdateStatusToWindow("checking-for-update");
});

autoUpdater.on("update-available", (info) => {
  log.info("发现新版本:", info.version);
  sendUpdateStatusToWindow("update-available", info);
});

autoUpdater.on("update-not-available", (info) => {
  log.info("当前已是最新版本");
  sendUpdateStatusToWindow("update-not-available", info);
});

autoUpdater.on("error", (err) => {
  log.error("更新错误:", err);
  sendUpdateStatusToWindow("update-error", { message: err.message });
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info(`下载进度: ${progressObj.percent}%`);
  sendUpdateStatusToWindow("download-progress", progressObj);
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("更新下载完成");
  sendUpdateStatusToWindow("update-downloaded", info);
});

// 发送更新状态到渲染进程
function sendUpdateStatusToWindow(event, data) {
  if (mainWindow) {
    mainWindow.webContents.send("update-status", { event, data });
  }
}

// 处理手动检查更新
ipcMain.on("check-for-updates", () => {
  if (NODE_ENV !== "development") {
    autoUpdater.checkForUpdates();
  } else {
    sendUpdateStatusToWindow("update-not-available", {
      message: "开发环境不支持自动更新",
    });
  }
});

// 处理下载更新
ipcMain.on("download-update", () => {
  if (NODE_ENV !== "development") {
    autoUpdater.downloadUpdate();
  }
});

// 处理安装更新
ipcMain.on("quit-and-install", () => {
  if (NODE_ENV !== "development") {
    autoUpdater.quitAndInstall();
  }
});

// 处理登录成功
ipcMain.on("login-success", () => {
  if (loginWindow) {
    loginWindow.close();
  }
  if (!mainWindow) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 处理登出
ipcMain.on("logout", () => {
  if (mainWindow) {
    mainWindow.close();
  }
  if (!loginWindow) {
    createLoginWindow();
  }
});

// 处理窗口最小化
ipcMain.on("minimize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.minimize();
  }
});

app.whenReady().then(async () => {
  // 首先创建一个隐藏的窗口来检查登录状态
  const checkWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (NODE_ENV === "development") {
    await checkWindow.loadURL("http://localhost:5173");
  } else {
    await checkWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  const isLoggedIn = await checkLoginStatus(checkWindow);
  checkWindow.close();

  if (isLoggedIn) {
    // 已登录，直接打开主窗口
    createMainWindow();
  } else {
    // 未登录，打开登录窗口
    createLoginWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
