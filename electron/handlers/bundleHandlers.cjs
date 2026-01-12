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

      // 获取货组商品列表，并关联 goods 表获取最新库存
      const items = db
        .prepare(
          `
          SELECT 
            bi.*,
            g.qty_available as current_stock
          FROM bundle_items bi
          LEFT JOIN goods g ON bi.sku = g.sku
          WHERE bi.bundle_id = ?
        `
        )
        .all(bundleId);

      // 使用最新库存覆盖历史库存
      const itemsWithStock = items.map((item) => ({
        ...item,
        qty_available:
          item.current_stock !== null ? item.current_stock : item.qty_available,
      }));

      return {
        success: true,
        data: {
          ...bundle,
          items: itemsWithStock,
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

  // 更新货组商品列表
  ipcMain.handle("db:update-bundle-items", async (event, data) => {
    try {
      const db = getDatabase();
      const {
        bundleId,
        items,
        totalValue,
        mainValue,
        giftValue,
        addedSkus = [],
        removedSkus = [],
      } = data;

      // 验证必要参数
      if (!bundleId) {
        return { success: false, error: "缺少货组ID" };
      }
      if (!items || !Array.isArray(items)) {
        return { success: false, error: "商品列表无效" };
      }

      const transaction = db.transaction(() => {
        // 获取原有商品列表，用于查找被删除商品的 inventory_id
        const oldItems = db
          .prepare(
            `SELECT sku, inventory_id FROM bundle_items WHERE bundle_id = ?`
          )
          .all(bundleId);

        // 创建 sku -> inventory_id 映射
        const oldItemMap = new Map();
        for (const item of oldItems) {
          oldItemMap.set(item.sku, item.inventory_id);
        }

        // 还原被删除商品的库存
        const updateInventoryAdd = db.prepare(`
          UPDATE inventory SET qty_available = qty_available + 1 WHERE id = ?
        `);
        for (const sku of removedSkus) {
          const inventoryId = oldItemMap.get(sku);
          if (inventoryId) {
            updateInventoryAdd.run(inventoryId);
          }
        }

        // 删除原有商品
        db.prepare("DELETE FROM bundle_items WHERE bundle_id = ?").run(
          bundleId
        );

        // 查找要扣减库存的 inventory 记录 id
        const findInventory = db.prepare(`
          SELECT id FROM inventory WHERE sku = ? AND qty_available > 0 LIMIT 1
        `);

        // 查找已被货组占用的 inventory 记录 id（用于保留的商品）
        const findExistingInventory = db.prepare(`
          SELECT id FROM inventory WHERE sku = ? LIMIT 1
        `);

        // 从 goods 表获取商品详细信息
        const getGoodsInfo = db.prepare(`
          SELECT shelf_life, item_size, net_weight, country_of_origin FROM goods WHERE sku = ?
        `);

        // 扣减库存的 SQL
        const updateInventoryDeduct = db.prepare(`
          UPDATE inventory SET qty_available = qty_available - 1 WHERE id = ?
        `);

        // 插入商品
        const insertItem = db.prepare(`
          INSERT INTO bundle_items (
            bundle_id, sku, article_code, tu, product_name_cn, product_name_en,
            cn_current_price, qty_available, remaining_months, declared_content, type, quantity, inventory_id,
            shelf_life, item_size, net_weight, country_of_origin, width, height
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 解析 item_size 获取宽和高的函数
        function parseItemSize(itemSize) {
          if (!itemSize || itemSize === "-" || itemSize.trim() === "") {
            return { width: null, height: null };
          }
          const parts = itemSize.split("x").map((p) => p.trim());
          if (parts.length >= 2) {
            return {
              width: parts[1] || null,
              height: parts[2] || null,
            };
          }
          return { width: null, height: null };
        }

        // 新增商品的 SKU 集合
        const addedSkuSet = new Set(addedSkus);

        for (const item of items) {
          const sku = item.sku || item.tu;
          let inventoryId = null;

          if (addedSkuSet.has(sku)) {
            // 新增商品，需要查找并扣减库存
            const inventoryRecord = findInventory.get(sku);
            inventoryId = inventoryRecord ? inventoryRecord.id : null;
          } else {
            // 保留的商品，使用原有的 inventory_id（不需要再次扣减库存）
            inventoryId = oldItemMap.get(sku) || null;
            // 如果原来没有 inventory_id，尝试查找一个（不扣减）
            if (!inventoryId) {
              const inventoryRecord = findExistingInventory.get(sku);
              inventoryId = inventoryRecord ? inventoryRecord.id : null;
            }
          }

          // 从 goods 表获取商品信息
          const goodsInfo = getGoodsInfo.get(sku);
          const shelfLife =
            item.shelf_life || (goodsInfo ? goodsInfo.shelf_life : null);
          const itemSize =
            item.item_size || (goodsInfo ? goodsInfo.item_size : null);
          const netWeight =
            item.net_weight || (goodsInfo ? goodsInfo.net_weight : null);
          const countryOfOrigin =
            item.country_of_origin ||
            (goodsInfo ? goodsInfo.country_of_origin : null);

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

          // 只对新增商品扣减库存
          if (addedSkuSet.has(sku) && inventoryId) {
            updateInventoryDeduct.run(inventoryId);
          }
        }

        // 更新货组的货值
        db.prepare(
          `
          UPDATE bundles SET
            total_value = ?,
            main_value = ?,
            gift_value = ?
          WHERE id = ?
        `
        ).run(totalValue, mainValue, giftValue, bundleId);
      });

      transaction();

      return { success: true };
    } catch (error) {
      console.error("Update bundle items error:", error);
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
  ipcMain.handle(
    "db:batch-export-bundles",
    async (event, ids, exportType = "sku") => {
      console.log("==== 批量导出开始 ====");
      console.log("接收到的参数 - ids:", ids);
      console.log("接收到的参数 - exportType:", exportType);

      try {
        const { dialog } = require("electron");
        const XLSX = require("xlsx");
        const db = getDatabase();

        // 根据导出类型设置不同的文件名
        console.log("准备导出，类型：", exportType);
        let defaultFileName;
        if (exportType === "sku") {
          defaultFileName = `SKU 导出_${dayjs().format(
            "YYYYMMDD_HHmmss"
          )}.xlsx`;
        } else if (exportType === "virtual") {
          defaultFileName = `虚拟组套导出_${dayjs().format(
            "YYYYMMDD_HHmmss"
          )}.xlsx`;
        } else {
          defaultFileName = `货组导出_${dayjs().format(
            "YYYYMMDD_HHmmss"
          )}.xlsx`;
        }

        // 弹出保存对话框
        const { filePath, canceled } = await dialog.showSaveDialog({
          title: exportType === "sku" ? "导出SKU表格" : "导出虚拟组套表格",
          defaultPath: defaultFileName,
          filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
        });

        // 如果用户取消，返回 canceled 状态
        if (canceled || !filePath) {
          return { success: false, canceled: true };
        }

        console.log("Export type:", exportType);

        if (exportType === "sku") {
          // SKU 导出（原有逻辑）
          console.log("Exporting SKU table...");
          return await exportSkuTable(db, ids, filePath);
        } else if (exportType === "virtual") {
          // 虚拟组套导出
          console.log("Exporting virtual table...");
          return await exportVirtualTable(db, ids, filePath);
        }

        return { success: false, error: "未知的导出类型" };
      } catch (error) {
        console.error("Batch export bundles error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  // SKU 导出函数
  async function exportSkuTable(db, ids, filePath) {
    const ExcelJS = require("exceljs");

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
      // 格式化日期为 YYYY/M/D 格式
      const formattedDate = bundle.created_at
        ? dayjs(bundle.created_at).format("YYYY/M/D")
        : "";

      skuMainData.push({
        虚拟表格编号: virtualTableIndex,
        SPU编码: "",
        商品编码: bundle.virtual_code,
        商品名称: bundle.name,
        商品全称: fullProductName,
        品牌名称: "Rituals",
        "零售价(元)": bundle.total_value,
        "标准进价(元)": bundle.total_value,
        商品分类路径: "",
        商品类型: "虚拟套组",
        拆包单位: "",
        组包单位: "",
        厂商货号: "",
        外部系统编码: "",
        新包装SKU编码: "",
        备注: "",
        保质期: shelfLife,
        // 原产地: countryOfOrigin,
        原产地: "",
        商品单位: "个",
        采购单位: "个",
        商品状态: "启用",
        颜色: "",
        // 尺码: itemSize,
        尺码: "",
        款色码: "",
        规格: "",
        是否ERP商品: "否",
        是否危险品: "否",
        是否消耗品: "否",
        图片: "",
      });
      virtualTableIndex++;
    }

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();

    // 创建 SKU 商品主档 sheet
    const wsMain = workbook.addWorksheet("SKU商品主档");

    // 定义列
    wsMain.columns = [
      { header: "虚拟表格编号", key: "虚拟表格编号", width: 12 },
      { header: "SPU编码", key: "SPU编码", width: 10 },
      { header: "商品编码", key: "商品编码", width: 15 },
      { header: "商品名称", key: "商品名称", width: 30 },
      { header: "商品全称", key: "商品全称", width: 50 },
      { header: "品牌名称", key: "品牌名称", width: 10 },
      { header: "零售价(元)", key: "零售价(元)", width: 12 },
      { header: "标准进价(元)", key: "标准进价(元)", width: 12 },
      { header: "商品分类路径", key: "商品分类路径", width: 15 },
      { header: "商品类型", key: "商品类型", width: 12 },
      { header: "拆包单位", key: "拆包单位", width: 10 },
      { header: "组包单位", key: "组包单位", width: 10 },
      { header: "厂商货号", key: "厂商货号", width: 12 },
      { header: "外部系统编码", key: "外部系统编码", width: 15 },
      { header: "新包装SKU编码", key: "新包装SKU编码", width: 18 },
      { header: "备注", key: "备注", width: 15 },
      { header: "保质期", key: "保质期", width: 15 },
      { header: "原产地", key: "原产地", width: 12 },
      { header: "商品单位", key: "商品单位", width: 10 },
      { header: "采购单位", key: "采购单位", width: 10 },
      { header: "商品状态", key: "商品状态", width: 10 },
      { header: "颜色", key: "颜色", width: 10 },
      { header: "尺码", key: "尺码", width: 15 },
      { header: "款色码", key: "款色码", width: 10 },
      { header: "规格", key: "规格", width: 10 },
      { header: "是否ERP商品", key: "是否ERP商品", width: 15 },
      { header: "是否危险品", key: "是否危险品", width: 12 },
      { header: "是否消耗品", key: "是否消耗品", width: 12 },
      { header: "图片", key: "图片", width: 10 },
    ];

    // 设置表头居中对齐
    wsMain.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // 添加数据
    wsMain.addRows(skuMainData);

    // 创建商品规格 sheet
    const wsSpec = workbook.addWorksheet("商品规格");
    wsSpec.columns = [
      { header: "虚拟主表编号", key: "虚拟主表编号", width: 12 },
      { header: "商品条码", key: "商品条码", width: 15 },
      { header: "商品单位", key: "商品单位", width: 10 },
      { header: "EA转换数量", key: "EA转换数量", width: 15 },
      { header: "标准售价", key: "标准售价", width: 12 },
      { header: "标准进价", key: "标准进价", width: 12 },
      { header: "毛重(KG)", key: "毛重(KG)", width: 12 },
      { header: "净重(KG)", key: "净重(KG)", width: 12 },
      { header: "材积(CM³)", key: "材积(CM³)", width: 15 },
      { header: "体积(CM³)", key: "体积(CM³)", width: 20 },
      { header: "宽(CM)", key: "宽(CM)", width: 10 },
      { header: "高", key: "高", width: 10 },
      { header: "单位状态", key: "单位状态", width: 10 },
    ];

    // 设置表头居中对齐
    wsSpec.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // 写入文件
    await workbook.xlsx.writeFile(filePath);

    return {
      success: true,
      count: skuMainData.length,
      filePath,
    };
  }

  // 虚拟组套导出函数
  async function exportVirtualTable(db, ids, filePath) {
    console.log("==== exportVirtualTable 函数开始执行 ====");
    console.log("参数 - ids:", ids);
    console.log("参数 - filePath:", filePath);

    const ExcelJS = require("exceljs");

    // 准备"组套商品"数据
    const bundleData = [];
    // 准备"组套商品明细"数据
    const detailData = [];

    let virtualTableIndex = 1; // 虚拟表格编号

    for (const id of ids) {
      // 获取货组信息
      const bundle = db.prepare(`SELECT * FROM bundles WHERE id = ?`).get(id);
      if (!bundle) continue;

      console.log("处理货组:", bundle.virtual_code);

      // 获取货组中的所有商品
      const items = db
        .prepare(
          `SELECT * FROM bundle_items WHERE bundle_id = ? ORDER BY id ASC`
        )
        .all(id);

      if (items.length === 0) continue;

      console.log("货组商品数量:", items.length);

      // 组套商品行数据
      bundleData.push({
        虚拟表格编号: virtualTableIndex,
        组合商品编码: bundle.virtual_code,
        组合名称: "抖音小红书",
        生效时间: bundle.created_at,
        失效时间: "2085年8月15日",
      });

      // 组套商品明细：每个商品一行
      for (const item of items) {
        detailData.push({
          虚拟主表编号: virtualTableIndex,
          "子品 sku 编码": item.sku,
          数量: 1,
          分摊比例: "",
        });
      }

      virtualTableIndex++;
    }

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();

    // 创建"组套商品" sheet
    const wsBundle = workbook.addWorksheet("组套商品");
    wsBundle.columns = [
      { header: "虚拟表格编号", key: "虚拟表格编号", width: 15 },
      { header: "组合商品编码", key: "组合商品编码", width: 20 },
      { header: "组合名称", key: "组合名称", width: 20 },
      { header: "生效时间", key: "生效时间", width: 20 },
      { header: "失效时间", key: "失效时间", width: 20 },
    ];

    // 设置表头居中对齐
    wsBundle.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // 添加数据
    wsBundle.addRows(bundleData);

    // 创建"组套商品明细" sheet
    const wsDetail = workbook.addWorksheet("组套商品明细");
    wsDetail.columns = [
      { header: "虚拟主表编号", key: "虚拟主表编号", width: 15 },
      { header: "子品 sku 编码", key: "子品 sku 编码", width: 20 },
      { header: "数量", key: "数量", width: 10 },
      { header: "分摊比例", key: "分摊比例", width: 15 },
    ];

    // 设置表头居中对齐
    wsDetail.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // 添加数据
    wsDetail.addRows(detailData);

    // 写入文件
    console.log("虚拟组套：准备写入文件:", filePath);
    console.log("虚拟组套：组套商品数量:", bundleData.length);
    console.log("虚拟组套：商品明细数量:", detailData.length);

    await workbook.xlsx.writeFile(filePath);

    console.log("==== 虚拟组套导出完成 ====");

    return {
      success: true,
      count: bundleData.length,
      filePath,
    };
  }
}

module.exports = {
  registerBundleHandlers,
};
