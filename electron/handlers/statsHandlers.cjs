const { ipcMain } = require("electron");
const { getDatabase } = require("../database/index.cjs");

/**
 * 注册统计信息相关的 IPC handlers
 */
function registerStatsHandlers() {
  // 获取统计信息
  ipcMain.handle("db:get-stats", async () => {
    try {
      const db = getDatabase();

      const countRes = db.prepare("SELECT COUNT(*) as count FROM goods").get();
      const count = countRes ? countRes.count : 0;

      const inventoryCountRes = db
        .prepare("SELECT COUNT(*) as count FROM inventory")
        .get();
      const inventoryCount = inventoryCountRes ? inventoryCountRes.count : 0;

      const timeRes = db
        .prepare("SELECT MAX(updated_at) as lastUpdate FROM goods")
        .get();
      const lastUpdate = timeRes ? timeRes.lastUpdate : null;

      return { count, inventoryCount, lastUpdate };
    } catch (error) {
      console.error("Get stats error:", error);
      return { count: 0, inventoryCount: 0, lastUpdate: null };
    }
  });
}

module.exports = {
  registerStatsHandlers,
};
