const { ipcMain } = require("electron");
const { getDatabase } = require("../database/index.cjs");
const dayjs = require("dayjs");

function registerBundleHandlers() {
  // 检查货组名称是否已存在
  ipcMain.handle("db:check-bundle-name-exists", async (event, name) => {
    try {
      const db = getDatabase();
      const existing = db
        .prepare(`SELECT id, name FROM bundles WHERE name = ?`)
        .get(name);
      return {
        success: true,
        exists: !!existing,
      };
    } catch (error) {
      console.error("Check bundle name exists error:", error);
      return { success: false, error: error.message };
    }
  });

  // 检查商品库存是否充足
  ipcMain.handle("db:check-stock-availability", async (event, items) => {
    try {
      const db = getDatabase();
      const insufficientItems = [];

      for (const item of items) {
        // 通过 sku 查询 goods 表中的库存数量
        const stock = db
          .prepare(`SELECT qty_available FROM goods WHERE sku = ?`)
          .get(item.sku || item.tu);

        const available = stock ? stock.qty_available : 0;
        if (available < 1) {
          insufficientItems.push({
            sku: item.sku || item.tu,
            article_code: item.article_code,
            product_name_cn: item.product_name_cn,
            qty_available: available,
          });
        }
      }

      return {
        success: true,
        sufficient: insufficientItems.length === 0,
        insufficientItems,
      };
    } catch (error) {
      console.error("Check stock availability error:", error);
      return { success: false, error: error.message };
    }
  });

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
            cn_current_price, qty_available, remaining_months, declared_content, type, quantity, inventory_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 查找要扣减库存的 inventory 记录 id
        const findInventory = db.prepare(`
          SELECT id FROM inventory WHERE sku = ? AND qty_available > 0 LIMIT 1
        `);

        // 扣减库存的 SQL - 根据指定 id 更新
        const updateInventory = db.prepare(`
          UPDATE inventory SET qty_available = qty_available - 1 WHERE id = ?
        `);

        for (const item of items) {
          // 查找要扣减的 inventory 记录
          const sku = item.sku || item.tu;
          const inventoryRecord = findInventory.get(sku);
          const inventoryId = inventoryRecord ? inventoryRecord.id : null;

          insertItem.run(
            bundleId,
            sku,
            item.article_code,
            item.tu,
            item.product_name_cn,
            item.product_name_en,
            item.cn_current_price || 0,
            item.qty_available || 0,
            item.remaining_months || "",
            item.declared_content || "",
            item.type,
            1,
            inventoryId
          );

          // 扣减库存（每个商品扣减1）
          if (inventoryId) {
            updateInventory.run(inventoryId);
          }
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
  ipcMain.handle("db:get-bundles", async (event, filters = {}) => {
    try {
      const db = getDatabase();

      // 构建查询条件
      let whereClause = " WHERE 1=1";
      const params = [];

      // 时间筛选：根据创建日期筛选
      if (filters.startDate) {
        whereClause += " AND DATE(created_at) >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereClause += " AND DATE(created_at) <= ?";
        params.push(filters.endDate);
      }

      // 关键词搜索：优先搜索名字，其次搜索虚拟编码
      if (filters.keyword) {
        whereClause += " AND (name LIKE ? OR virtual_code LIKE ?)";
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.usageType) {
        whereClause += " AND usage_type = ?";
        params.push(filters.usageType);
      }

      if (filters.category) {
        whereClause += " AND category = ?";
        params.push(filters.category);
      }

      // 排序：优先按名字匹配度排序（如果有关键词），然后按创建时间倒序
      let orderByClause = "";
      const orderParams = [];
      if (filters.keyword) {
        orderByClause = ` ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1 
            WHEN virtual_code LIKE ? THEN 2 
            ELSE 3 
          END, created_at DESC`;
        orderParams.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      } else {
        orderByClause = " ORDER BY created_at DESC";
      }

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM bundles${whereClause}`;
      const countStmt = db.prepare(countSql);
      const { total } = countStmt.get(...params);

      // 分页参数
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const offset = (page - 1) * pageSize;

      // 查询数据
      const dataSql = `
        SELECT 
          id, virtual_code, name, created_at as create_date, end_date, usage_type,
          total_value, main_value, gift_value,
          category, product_type, by_sku, fragrance, status
        FROM bundles${whereClause}${orderByClause}
        LIMIT ? OFFSET ?
      `;
      const dataStmt = db.prepare(dataSql);
      const results = dataStmt.all(...params, ...orderParams, pageSize, offset);

      return {
        data: results,
        total: total,
        page: page,
        pageSize: pageSize,
      };
    } catch (error) {
      console.error("Get bundles error:", error);
      return { data: [], total: 0 };
    }
  });

  // 获取货组详情
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

      // 先获取货组中的商品列表，用于还原库存
      const items = db
        .prepare(`SELECT inventory_id FROM bundle_items WHERE bundle_id = ?`)
        .all(id);

      const transaction = db.transaction(() => {
        // 还原库存的 SQL - 根据 inventory_id 精确还原
        const updateInventory = db.prepare(`
          UPDATE inventory SET qty_available = qty_available + 1 WHERE id = ?
        `);

        // 还原每个商品的库存
        for (const item of items) {
          if (item.inventory_id) {
            updateInventory.run(item.inventory_id);
          }
        }

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

  // 获取今天的货组数量, 用于生成虚拟编码
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

      // 先获取所有货组中的商品列表，用于还原库存
      const getItems = db.prepare(
        `SELECT inventory_id FROM bundle_items WHERE bundle_id = ?`
      );

      const transaction = db.transaction(() => {
        const deleteItems = db.prepare(
          "DELETE FROM bundle_items WHERE bundle_id = ?"
        );
        const deleteBundles = db.prepare("DELETE FROM bundles WHERE id = ?");

        // 还原库存的 SQL - 根据 inventory_id 精确还原
        const updateInventory = db.prepare(`
          UPDATE inventory SET qty_available = qty_available + 1 WHERE id = ?
        `);

        for (const id of ids) {
          // 获取该货组的商品列表
          const items = getItems.all(id);

          // 还原每个商品的库存
          for (const item of items) {
            if (item.inventory_id) {
              updateInventory.run(item.inventory_id);
            }
          }

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

  // 批量导出货组
  ipcMain.handle("db:batch-export-bundles", async (event, ids) => {
    try {
      const { dialog } = require("electron");
      const XLSX = require("xlsx");
      const db = getDatabase();

      // 弹出保存对话框
      const { filePath } = await dialog.showSaveDialog({
        title: "批量导出货组",
        defaultPath: `货组批量导出_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (!filePath) {
        return { success: false, error: "用户取消" };
      }

      // 准备导出数据 - 每行对应一个虚拟编码
      const exportData = [];

      for (const id of ids) {
        // 获取货组信息
        const bundle = db.prepare(`SELECT * FROM bundles WHERE id = ?`).get(id);

        if (!bundle) continue;

        exportData.push({
          虚拟编码: bundle.virtual_code,
          货组名称: bundle.name,
          创建日期: bundle.created_at.split(" ")[0],
          结束日期: bundle.end_date,
          用途: bundle.usage_type === "cooperation" ? "合作" : "自营",
          总货值: bundle.total_value,
          主品货值: bundle.main_value,
          赠品货值: bundle.gift_value,
          分类: bundle.category,
          品类: bundle.product_type,
          "By-sku": bundle.by_sku,
          香型: bundle.fragrance,
          状态: bundle.status,
        });
      }

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      ws["!cols"] = [
        { wch: 15 }, // 虚拟编码
        { wch: 20 }, // 货组名称
        { wch: 12 }, // 创建日期
        { wch: 12 }, // 结束日期
        { wch: 8 }, // 用途
        { wch: 12 }, // 总货值
        { wch: 12 }, // 主品货值
        { wch: 12 }, // 赠品货值
        { wch: 12 }, // 分类
        { wch: 12 }, // 品类
        { wch: 12 }, // By-sku
        { wch: 12 }, // 香型
        { wch: 10 }, // 状态
      ];

      XLSX.utils.book_append_sheet(wb, ws, "货组数据");
      XLSX.writeFile(wb, filePath);

      return {
        success: true,
        count: exportData.length,
        filePath,
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
