const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const NODE_ENV = process.env.NODE_ENV;

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
}

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
