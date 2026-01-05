const { app, BrowserWindow } = require("electron");
const path = require("path");
const log = require("electron-log");
const { initDatabase } = require("./database/index.cjs");
const { registerAllHandlers } = require("./handlers/index.cjs");

const NODE_ENV = process.env.NODE_ENV;

// 配置日志
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB

log.info("应用启动 - 环境:", NODE_ENV || "production");
log.info("日志文件路径:", log.transports.file.getFile().path);

// 捕获未处理的错误
process.on("uncaughtException", (error) => {
  log.error("未捕获的异常:", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("未处理的 Promise 拒绝:", reason);
});

// 主窗口
function createWindow() {
  log.info("创建主窗口...");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 监听窗口错误
  win.webContents.on("crashed", () => {
    log.error("渲染进程崩溃");
  });

  win.webContents.on("render-process-gone", (event, details) => {
    log.error("渲染进程消失:", details);
  });

  win.on("unresponsive", () => {
    log.warn("窗口无响应");
  });

  if (NODE_ENV === "development") {
    log.info("加载开发服务器: http://localhost:5173");
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    log.info("加载生产环境页面:", indexPath);
    win.loadFile(indexPath).catch((err) => {
      log.error("加载页面失败:", err);
    });
  }

  log.info("主窗口创建成功");
}

// 应用启动
app
  .whenReady()
  .then(() => {
    log.info("Electron 应用就绪");

    try {
      // 初始化数据库
      log.info("初始化数据库...");
      initDatabase();
      log.info("数据库初始化成功");

      // 注册所有 IPC handlers
      log.info("注册 IPC handlers...");
      registerAllHandlers();
      log.info("IPC handlers 注册成功");

      // 创建窗口
      createWindow();
    } catch (error) {
      log.error("应用初始化失败:", error);
      app.quit();
    }

    app.on("activate", () => {
      log.info("应用激活事件触发");
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((err) => {
    log.error("应用启动失败:", err);
  });

// 窗口关闭
app.on("window-all-closed", () => {
  log.info("所有窗口已关闭");
  if (process.platform !== "darwin") {
    log.info("退出应用");
    app.quit();
  }
});

// 应用退出前
app.on("before-quit", () => {
  log.info("应用即将退出");
});

module.exports = { log };
