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
            cn_current_price, qty_available, remaining_months, declared_content, type, quantity, inventory_id,
            shelf_life, item_size, net_weight, country_of_origin, width, height
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 查找要扣减库存的 inventory 记录 id
        const findInventory = db.prepare(`
          SELECT id FROM inventory WHERE sku = ? AND qty_available > 0 LIMIT 1
        `);

        // 从 goods 表获取商品详细信息
        const getGoodsInfo = db.prepare(`
          SELECT shelf_life, item_size, net_weight, country_of_origin FROM goods WHERE sku = ?
        `);

        // 扣减库存的 SQL - 根据指定 id 更新
        const updateInventory = db.prepare(`
          UPDATE inventory SET qty_available = qty_available - 1 WHERE id = ?
        `);

        // 解析 item_size 获取宽和高的函数
        function parseItemSize(itemSize) {
          if (!itemSize || itemSize === "-" || itemSize.trim() === "") {
            return { width: null, height: null };
          }
          // 格式: "宽 x 高 x 长" 或 "150 x 200 x 100"
          const parts = itemSize.split("x").map((p) => p.trim());
          if (parts.length >= 2) {
            return {
              width: parts[1] || null,
              height: parts[2] || null,
            };
          }
          return { width: null, height: null };
        }

        for (const item of items) {
          // 查找要扣减的 inventory 记录
          const sku = item.sku || item.tu;
          const inventoryRecord = findInventory.get(sku);
          const inventoryId = inventoryRecord ? inventoryRecord.id : null;

          // 从 goods 表获取商品信息
          const goodsInfo = getGoodsInfo.get(sku);
          const shelfLife = goodsInfo ? goodsInfo.shelf_life : null;
          const itemSize = goodsInfo ? goodsInfo.item_size : null;
          const netWeight = goodsInfo ? goodsInfo.net_weight : null;
          const countryOfOrigin = goodsInfo
            ? goodsInfo.country_of_origin
            : null;

          // 解析宽和高
          const { width, height } = parseItemSize(itemSize);

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
            inventoryId,
            shelfLife,
            itemSize,
            netWeight,
            countryOfOrigin,
            width,
            height
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
      // 查询所有以BD开头的虚拟编码（不带Gbox_前缀）
      const countResult = db
        .prepare(
          `SELECT COUNT(*) as count FROM bundles WHERE virtual_code LIKE 'BD%' OR virtual_code LIKE 'Gbox_BD%'`
        )
        .get();
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
        defaultPath: `货组导出_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (!filePath) {
        return { success: false, error: "用户取消" };
      }

      // 准备 SKU 商品主档数据
      const skuMainData = [];
      // 准备商品规格数据
      const specData = [];

      let virtualTableIndex = 1; // 虚拟表格编号

      for (const id of ids) {
        // 获取货组信息
        const bundle = db.prepare(`SELECT * FROM bundles WHERE id = ?`).get(id);
        if (!bundle) continue;

        // 获取货组中的所有商品（主品和赠品）
        const items = db
          .prepare(
            `SELECT * FROM bundle_items WHERE bundle_id = ? ORDER BY type DESC, id ASC`
          )
          .all(id);

        if (items.length === 0) continue;

        // 获取第一个主品的信息（用于保质期、原产地、尺码）
        const firstMainItem = items.find((item) => item.type === "main");
        const shelfLife = firstMainItem ? firstMainItem.shelf_life || "" : "";
        const countryOfOrigin = firstMainItem
          ? firstMainItem.country_of_origin || ""
          : "";
        const itemSize = firstMainItem ? firstMainItem.item_size || "" : "";

        // 构建商品全称：主品+赠品，用"+"连接
        const mainItems = items.filter((item) => item.type === "main");
        const giftItems = items.filter((item) => item.type === "gift");
        const allProductNames = [
          ...mainItems.map((item) => item.product_name_cn),
          ...giftItems.map((item) => item.product_name_cn),
        ];
        const fullProductName = allProductNames.join(" + ");

        // SKU 商品主档行数据
        skuMainData.push({
          虚拟表格编号: virtualTableIndex,
          SPU编码: "",
          商品编码: bundle.virtual_code,
          商品名称: bundle.name,
          商品全称: fullProductName,
          品牌名称: "Rituals",
          "零售价（元）": bundle.total_value,
          "标准进价（元）": bundle.total_value,
          商品分类路径: "",
          商品类型: "虚拟套组",
          拆包单位: "",
          组包单位: "",
          厂商货号: "",
          外部系统编码: "",
          "新包装 SKU 编码": "",
          备注: "",
          保质期: shelfLife,
          原产地: countryOfOrigin,
          商品单位: "个",
          采购单位: "个",
          商品状态: "启用",
          颜色: "",
          尺码: itemSize,
          款色码: "",
          规格: "",
          "是否 ERP 商品": "否",
          是否危险品: "否",
          是否消耗品: "否",
          图片: "",
        });

        // 商品规格：每个商品一行
        for (const item of items) {
          specData.push({
            虚拟主表编号: virtualTableIndex,
            商品条码: "",
            商品单位: "个",
            "EA 转换数量": "",
            标准售价: bundle.total_value,
            标准进价: "",
            "毛重（KG）": "",
            "净重（KG）": item.net_weight || "",
            "材积（CM^3）": "",
            "体积（CM^3）": item.item_size || "",
            "宽（CM）": item.width || "",
            高: item.height || "",
            单位状态: "有效",
          });
        }

        virtualTableIndex++;
      }

      // 创建工作簿
      const wb = XLSX.utils.book_new();

      // 创建 SKU 商品主档 sheet
      const wsMain = XLSX.utils.json_to_sheet(skuMainData);
      // 设置列宽
      wsMain["!cols"] = [
        { wch: 12 }, // 虚拟表格编号
        { wch: 10 }, // SPU编码
        { wch: 15 }, // 商品编码
        { wch: 30 }, // 商品名称
        { wch: 50 }, // 商品全称
        { wch: 10 }, // 品牌名称
        { wch: 12 }, // 零售价（元）
        { wch: 12 }, // 标准进价（元）
        { wch: 15 }, // 商品分类路径
        { wch: 12 }, // 商品类型
        { wch: 10 }, // 拆包单位
        { wch: 10 }, // 组包单位
        { wch: 12 }, // 厂商货号
        { wch: 15 }, // 外部系统编码
        { wch: 18 }, // 新包装 SKU 编码
        { wch: 15 }, // 备注
        { wch: 15 }, // 保质期
        { wch: 12 }, // 原产地
        { wch: 10 }, // 商品单位
        { wch: 10 }, // 采购单位
        { wch: 10 }, // 商品状态
        { wch: 10 }, // 颜色
        { wch: 15 }, // 尺码
        { wch: 10 }, // 款色码
        { wch: 10 }, // 规格
        { wch: 15 }, // 是否 ERP 商品
        { wch: 12 }, // 是否危险品
        { wch: 12 }, // 是否消耗品
        { wch: 10 }, // 图片
      ];
      XLSX.utils.book_append_sheet(wb, wsMain, "SKU商品主档");

      // 创建商品规格 sheet
      const wsSpec = XLSX.utils.json_to_sheet(specData);
      // 设置列宽
      wsSpec["!cols"] = [
        { wch: 12 }, // 虚拟主表编号
        { wch: 15 }, // 商品条码
        { wch: 10 }, // 商品单位
        { wch: 15 }, // EA 转换数量
        { wch: 12 }, // 标准售价
        { wch: 12 }, // 标准进价
        { wch: 12 }, // 毛重（KG）
        { wch: 12 }, // 净重（KG）
        { wch: 15 }, // 材积（CM^3）
        { wch: 20 }, // 体积（CM^3）
        { wch: 10 }, // 宽（CM）
        { wch: 10 }, // 高
        { wch: 10 }, // 单位状态
      ];
      XLSX.utils.book_append_sheet(wb, wsSpec, "商品规格");

      // 写入文件
      XLSX.writeFile(wb, filePath);

      return {
        success: true,
        count: skuMainData.length,
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
