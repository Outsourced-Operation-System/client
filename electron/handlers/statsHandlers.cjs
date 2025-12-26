const { ipcMain } = require("electron");
const { getDatabase } = require("../database/index.cjs");

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

      // 获取货品表的最后更新时间
      const goodsTimeRes = db
        .prepare("SELECT MAX(updated_at) as lastUpdate FROM products")
        .get();
      const goodsLastUpdate = goodsTimeRes ? goodsTimeRes.lastUpdate : null;

      // 获取库存表的最后更新时间
      const inventoryTimeRes = db
        .prepare("SELECT MAX(updated_at) as lastUpdate FROM inventory")
        .get();
      const inventoryLastUpdate = inventoryTimeRes
        ? inventoryTimeRes.lastUpdate
        : null;

      // 获取标签表的最后更新时间
      const labelTimeRes = db
        .prepare("SELECT MAX(updated_at) as lastUpdate FROM labels")
        .get();
      const labelLastUpdate = labelTimeRes ? labelTimeRes.lastUpdate : null;

      return {
        count,
        inventoryCount,
        goodsLastUpdate,
        inventoryLastUpdate,
        labelLastUpdate,
      };
    } catch (error) {
      console.error("Get stats error:", error);
      return {
        count: 0,
        inventoryCount: 0,
        goodsLastUpdate: null,
        inventoryLastUpdate: null,
        labelLastUpdate: null,
      };
    }
  });
}

module.exports = {
  registerStatsHandlers,
};
