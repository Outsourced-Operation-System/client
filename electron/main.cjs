const { app, BrowserWindow } = require("electron");
const path = require("path");
const { initDatabase } = require("./database/index.cjs");
const { registerAllHandlers } = require("./handlers/index.cjs");

const NODE_ENV = process.env.NODE_ENV;

/**
 * 创建主窗口
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

/**
 * 应用启动
 */
app.whenReady().then(() => {
  // 初始化数据库
  initDatabase();

  // 注册所有 IPC handlers
  registerAllHandlers();

  // 创建窗口
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 窗口关闭处理
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
