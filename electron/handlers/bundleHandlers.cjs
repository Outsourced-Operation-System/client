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
      const {
        name,
        virtualCode,
        endDate,
        items,
        totalValue,
        mainValue,
        giftValue,
        category,
        productType,
        bySku,
        fragrance,
        usageType,
      } = bundleData;
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

      const transaction = db.transaction(() => {
        const insertBundle = db.prepare(`
          INSERT INTO bundles (
            virtual_code, name, created_at, end_date, usage_type,
            total_value, main_value, gift_value,
            category, product_type, by_sku, fragrance, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = insertBundle.run(
          virtualCode,
          name,
          now,
          endDate,
          usageType,
          totalValue,
          mainValue,
          giftValue,
          category,
          productType,
          bySku,
          fragrance,
          "有效"
        );
        const bundleId = info.lastInsertRowid;

        const insertItem = db.prepare(`
          INSERT INTO bundle_items (
            bundle_id, sku, article_code, tu, product_name_cn, product_name_en,
            cn_current_price, qty_available, tu_shelf_life, declared_content, type, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          insertItem.run(
            bundleId,
            item.sku || item.tu,
            item.article_code,
            item.tu,
            item.product_name_cn,
            item.product_name_en,
            item.cn_current_price || 0,
            item.qty_available || 0,
            item.tu_shelf_life || "",
            item.declared_content || "",
            item.type,
            1
          );
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
      let sql = `
        SELECT 
          id, virtual_code, name, created_at as create_date, end_date, usage_type,
          total_value, main_value, gift_value,
          category, product_type, by_sku, fragrance, status
        FROM bundles WHERE 1=1
      `;
      const params = [];

      // 时间筛选：根据创建日期筛选
      if (filters.startDate) {
        sql += " AND DATE(created_at) >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        sql += " AND DATE(created_at) <= ?";
        params.push(filters.endDate);
      }

      // 关键词搜索：优先搜索名字，其次搜索虚拟编码
      if (filters.keyword) {
        sql += " AND (name LIKE ? OR virtual_code LIKE ?)";
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      if (filters.status) {
        sql += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.usageType) {
        sql += " AND usage_type = ?";
        params.push(filters.usageType);
      }

      if (filters.category) {
        sql += " AND category = ?";
        params.push(filters.category);
      }

      // 排序：优先按名字匹配度排序（如果有关键词），然后按创建时间倒序
      if (filters.keyword) {
        sql += ` ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1 
            WHEN virtual_code LIKE ? THEN 2 
            ELSE 3 
          END, created_at DESC`;
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      } else {
        sql += " ORDER BY created_at DESC";
      }

      const stmt = db.prepare(sql);
      const results = stmt.all(...params);
      return results;
    } catch (error) {
      console.error("Get bundles error:", error);
      return [];
    }
  });

  // 获取货组详情（包含商品列表）
  ipcMain.handle("db:get-bundle-detail", async (event, bundleId) => {
    try {
      const db = getDatabase();

      // 获取货组基本信息
      const bundle = db
        .prepare(`SELECT * FROM bundles WHERE id = ?`)
        .get(bundleId);

      if (!bundle) {
        return { success: false, error: "货组不存在" };
      }

      // 获取货组商品列表
      const items = db
        .prepare(`SELECT * FROM bundle_items WHERE bundle_id = ?`)
        .all(bundleId);

      return {
        success: true,
        data: {
          ...bundle,
          items,
        },
      };
    } catch (error) {
      console.error("Get bundle detail error:", error);
      return { success: false, error: error.message };
    }
  });

  // 删除货组
  ipcMain.handle("db:delete-bundle", async (event, id) => {
    try {
      const db = getDatabase();
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM bundle_items WHERE bundle_id = ?").run(id);
        db.prepare("DELETE FROM bundles WHERE id = ?").run(id);
      });
      transaction();
      return { success: true };
    } catch (error) {
      console.error("Delete bundle error:", error);
      return { success: false, error: error.message };
    }
  });

  // 更新货组状态
  ipcMain.handle("db:update-bundle-status", async (event, id, status) => {
    try {
      const db = getDatabase();
      db.prepare("UPDATE bundles SET status = ? WHERE id = ?").run(status, id);
      return { success: true };
    } catch (error) {
      console.error("Update bundle status error:", error);
      return { success: false, error: error.message };
    }
  });

  // 更新货组信息
  ipcMain.handle("db:update-bundle", async (event, bundleData) => {
    try {
      const db = getDatabase();
      const {
        id,
        name,
        endDate,
        usageType,
        category,
        productType,
        bySku,
        fragrance,
        status,
      } = bundleData;

      db.prepare(
        `
        UPDATE bundles SET
          name = ?,
          end_date = ?,
          usage_type = ?,
          category = ?,
          product_type = ?,
          by_sku = ?,
          fragrance = ?,
          status = ?
        WHERE id = ?
      `
      ).run(
        name,
        endDate,
        usageType,
        category,
        productType,
        bySku,
        fragrance,
        status,
        id
      );
      return { success: true };
    } catch (error) {
      console.error("Update bundle error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取今天的货组数量
  ipcMain.handle("db:get-today-bundle-count", async () => {
    try {
      const db = getDatabase();
      const dateStr = dayjs().format("YYYYMMDD");
      const countResult = db
        .prepare(
          `SELECT COUNT(*) as count FROM bundles WHERE virtual_code LIKE ?`
        )
        .get(`BD${dateStr}%`);
      return { count: countResult ? countResult.count : 0 };
    } catch (error) {
      console.error("Get today bundle count error:", error);
      return { count: 0 };
    }
  });

  // 批量删除货组
  ipcMain.handle("db:batch-delete-bundles", async (event, ids) => {
    try {
      const db = getDatabase();
      const transaction = db.transaction(() => {
        const deleteItems = db.prepare(
          "DELETE FROM bundle_items WHERE bundle_id = ?"
        );
        const deleteBundles = db.prepare("DELETE FROM bundles WHERE id = ?");

        for (const id of ids) {
          deleteItems.run(id);
          deleteBundles.run(id);
        }
      });
      transaction();
      return { success: true, count: ids.length };
    } catch (error) {
      console.error("Batch delete bundles error:", error);
      return { success: false, error: error.message };
    }
  });

  // 导出单个货组
  ipcMain.handle("db:export-bundle", async (event, id) => {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");
      const path = require("path");
      const db = getDatabase();

      // 获取货组信息
      const bundle = db.prepare(`SELECT * FROM bundles WHERE id = ?`).get(id);

      if (!bundle) {
        return { success: false, error: "货组不存在" };
      }

      // 获取货组商品列表
      const items = db
        .prepare(`SELECT * FROM bundle_items WHERE bundle_id = ?`)
        .all(id);

      // 弹出保存对话框
      const { filePath } = await dialog.showSaveDialog({
        title: "导出货组",
        defaultPath: `货组_${bundle.virtual_code}_${bundle.name}.json`,
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      });

      if (!filePath) {
        return { success: false, error: "用户取消" };
      }

      // 保存文件
      const data = { bundle, items };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

      return { success: true, filePath };
    } catch (error) {
      console.error("Export bundle error:", error);
      return { success: false, error: error.message };
    }
  });

  // 批量导出货组
  ipcMain.handle("db:batch-export-bundles", async (event, ids) => {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");
      const path = require("path");
      const db = getDatabase();

      // 弹出文件夹选择对话框
      const { filePaths } = await dialog.showOpenDialog({
        title: "选择导出文件夹",
        properties: ["openDirectory"],
      });

      if (!filePaths || filePaths.length === 0) {
        return { success: false, error: "用户取消" };
      }

      const exportDir = filePaths[0];
      const exportedFiles = [];

      for (const id of ids) {
        // 获取货组信息
        const bundle = db.prepare(`SELECT * FROM bundles WHERE id = ?`).get(id);

        if (!bundle) continue;

        // 获取货组商品列表
        const items = db
          .prepare(`SELECT * FROM bundle_items WHERE bundle_id = ?`)
          .all(id);

        // 保存文件
        const fileName = `货组_${bundle.virtual_code}_${bundle.name}.json`;
        const filePath = path.join(exportDir, fileName);
        const data = { bundle, items };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        exportedFiles.push(fileName);
      }

      return {
        success: true,
        count: exportedFiles.length,
        files: exportedFiles,
      };
    } catch (error) {
      console.error("Batch export bundles error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerBundleHandlers,
};
