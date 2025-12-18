const { ipcMain } = require("electron");
const { getDatabase } = require("../database/index.cjs");
const dayjs = require("dayjs");

/**
 * 注册货组相关的 IPC handlers
 */
function registerBundleHandlers() {
  // 创建货组
  ipcMain.handle("db:create-bundle", async (event, bundleData) => {
    try {
      const db = getDatabase();
      const { name, startDate, endDate, items, totalValue } = bundleData;
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const dateStr = dayjs().format("YYYYMMDD");

      const countResult = db
        .prepare(
          `SELECT COUNT(*) as count FROM bundles WHERE virtual_code LIKE ?`
        )
        .get(`BD${dateStr}%`);

      const count = countResult ? countResult.count : 0;
      const sequence = String(count + 1).padStart(3, "0");
      const virtualCode = `BD${dateStr}${sequence}`;

      const transaction = db.transaction(() => {
        const insertBundle = db.prepare(
          "INSERT INTO bundles (virtual_code, name, start_date, end_date, total_value, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        const info = insertBundle.run(
          virtualCode,
          name,
          startDate,
          endDate,
          totalValue,
          "有效",
          now
        );
        const bundleId = info.lastInsertRowid;

        const insertItem = db.prepare(
          "INSERT INTO bundle_items (bundle_id, product_id, type, quantity) VALUES (?, ?, ?, ?)"
        );

        for (const item of items) {
          insertItem.run(bundleId, item.id, item.type, 1);
        }
      });

      transaction();
      return { success: true, virtualCode };
    } catch (error) {
      console.error("Create bundle error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取货组列表
  ipcMain.handle("db:get-bundles", async (event, filters) => {
    try {
      const db = getDatabase();
      let sql = "SELECT * FROM bundles WHERE 1=1";
      const params = [];

      if (filters.keyword) {
        sql += " AND (name LIKE ? OR virtual_code LIKE ?)";
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      sql += " ORDER BY created_at DESC";

      const stmt = db.prepare(sql);
      const results = stmt.all(...params);
      return results;
    } catch (error) {
      console.error("Get bundles error:", error);
      return [];
    }
  });

  // 删除货组
  ipcMain.handle("db:delete-bundle", async (event, id) => {
    try {
      const db = getDatabase();
      db.prepare("DELETE FROM bundles WHERE id = ?").run(id);
      db.prepare("DELETE FROM bundle_items WHERE bundle_id = ?").run(id);
      return { success: true };
    } catch (error) {
      console.error("Delete bundle error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerBundleHandlers,
};
