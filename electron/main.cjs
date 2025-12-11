const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");
const xlsx = require("xlsx");
const dayjs = require("dayjs");

const NODE_ENV = process.env.NODE_ENV;
let db;
const dbPath = path.join(app.getPath("userData"), "bundle.db");

async function initDB() {
  try {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
    } else {
      db = new SQL.Database();
    }

    // 检查是否需要迁移旧数据（从 products 表迁移到 goods 表）
    migrateOldData();

    createTables();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

// 迁移旧的 products 表数据到新的 goods 表
function migrateOldData() {
  try {
    // 检查旧的 products 表是否存在
    const tableCheck = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
    );
    if (tableCheck.length === 0 || tableCheck[0].values.length === 0) {
      return; // 没有旧表，无需迁移
    }

    // 检查新的 goods 表是否已存在
    const goodsCheck = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='goods'"
    );
    if (goodsCheck.length > 0 && goodsCheck[0].values.length > 0) {
      // goods 表已存在，检查是否有数据
      const goodsCount = db.exec("SELECT COUNT(*) FROM goods");
      if (goodsCount[0].values[0][0] > 0) {
        // goods 表已有数据，删除旧的 products 表
        db.run("DROP TABLE IF EXISTS products");
        saveDB();
        return;
      }
    }

    // 迁移数据：从 products 表复制到 goods 表
    console.log("开始迁移旧的 products 表数据到 goods 表...");

    // 先创建 goods 表（如果不存在）
    db.run(`
      CREATE TABLE IF NOT EXISTS goods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        change TEXT,
        launch_status TEXT,
        launch_month TEXT,
        delisting_month TEXT,
        category TEXT,
        article_code TEXT,
        tu TEXT,
        product_name_en TEXT,
        product_name_cn TEXT,
        cn_registration TEXT,
        declared_content TEXT,
        cn_current_price REAL,
        ean_code TEXT,
        collation TEXT,
        shelf_life TEXT,
        net_weight TEXT,
        item_size TEXT,
        country_of_origin TEXT,
        retail TEXT,
        digital TEXT,
        updated_at TEXT,
        UNIQUE(article_code, tu)
      )
    `);

    // 复制数据
    db.run(`
      INSERT OR IGNORE INTO goods (
        article_code, tu, category, product_name_en, product_name_cn,
        declared_content, cn_current_price, shelf_life, net_weight,
        item_size, country_of_origin, updated_at
      )
      SELECT 
        article_code, tu, category, product_name_en, product_name_cn,
        declared_content, cn_current_price, shelf_life, net_weight,
        item_size, country_of_origin, updated_at
      FROM products
    `);

    // 删除旧的 products 表
    db.run("DROP TABLE IF EXISTS products");

    console.log("数据迁移完成");
    saveDB();
  } catch (err) {
    console.error("数据迁移失败:", err);
  }
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  // 货品表 - 包含所有货品信息字段
  const goodsSql = `
    CREATE TABLE IF NOT EXISTS goods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      change TEXT,
      launch_status TEXT,
      launch_month TEXT,
      delisting_month TEXT,
      category TEXT,
      article_code TEXT,
      tu TEXT,
      product_name_en TEXT,
      product_name_cn TEXT,
      cn_registration TEXT,
      declared_content TEXT,
      cn_current_price REAL,
      ean_code TEXT,
      collation TEXT,
      shelf_life TEXT,
      net_weight TEXT,
      item_size TEXT,
      country_of_origin TEXT,
      retail TEXT,
      digital TEXT,
      updated_at TEXT,
      UNIQUE(article_code, tu)
    );
  `;

  // 库存表 - 包含所有库存信息字段
  const inventorySql = `
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporting_date TEXT,
      itm_articleid TEXT,
      itm_dg_chemicals TEXT,
      itm_dg_class_cn TEXT,
      storerkey TEXT,
      facility TEXT,
      inventory_type TEXT,
      main_rituals TEXT,
      busr8 TEXT,
      sku TEXT,
      sku_descr TEXT,
      extendedfield01 TEXT,
      batch_code TEXT,
      expiry_date TEXT,
      remaining_months INTEGER,
      remaining_days INTEGER,
      qty INTEGER DEFAULT 0,
      qty_allocated INTEGER DEFAULT 0,
      qty_picked INTEGER DEFAULT 0,
      qty_available INTEGER DEFAULT 0,
      hold_status TEXT,
      ciq TEXT,
      pk TEXT,
      inv_id TEXT,
      lot TEXT,
      sscc TEXT,
      receipt_date TEXT,
      alt_sku TEXT,
      loc TEXT,
      virtual_sku TEXT,
      tu_shelf_life TEXT,
      article_shelf_life TEXT,
      updated_at TEXT
    );
  `;

  // 产品视图 - 从货品表和库存表中提取数据，使用 TU 和 SKU 关联
  const productViewSql = `
    CREATE VIEW IF NOT EXISTS products_view AS
    SELECT 
      g.id,
      g.category,
      g.article_code,
      g.tu,
      g.product_name_en,
      g.product_name_cn,
      g.declared_content,
      g.cn_current_price,
      g.shelf_life,
      g.net_weight,
      g.item_size,
      g.country_of_origin,
      COALESCE(SUM(i.qty_available), 0) AS qty_available,
      g.updated_at
    FROM goods g
    LEFT JOIN inventory i ON g.tu = i.sku
    GROUP BY g.id, g.category, g.article_code, g.tu, g.product_name_en, 
             g.product_name_cn, g.declared_content, g.cn_current_price, 
             g.shelf_life, g.net_weight, g.item_size, g.country_of_origin, g.updated_at;
  `;

  // Bundles 表
  const bundlesSql = `
    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      virtual_code TEXT UNIQUE,
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      total_value REAL,
      status TEXT,
      created_at TEXT
    );
  `;

  // Bundle Items 表
  const bundleItemsSql = `
    CREATE TABLE IF NOT EXISTS bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id INTEGER,
      product_id INTEGER,
      type TEXT,
      quantity INTEGER,
      FOREIGN KEY(bundle_id) REFERENCES bundles(id),
      FOREIGN KEY(product_id) REFERENCES goods(id)
    );
  `;

  db.run(goodsSql);
  db.run(inventorySql);
  db.run(bundlesSql);
  db.run(bundleItemsSql);

  // 先删除旧视图再创建新视图（如果存在）
  try {
    db.run("DROP VIEW IF EXISTS products_view");
  } catch (e) {
    // 忽略错误
  }
  db.run(productViewSql);

  saveDB();
}

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

app.whenReady().then(async () => {
  await initDB();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers

// Import Data
ipcMain.handle("db:import-data", async (event, type, filePath, mode) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

    db.run("BEGIN TRANSACTION");

    if (type === "product") {
      // 如果是覆盖模式，先清空货品表
      if (mode === "overwrite") {
        db.run("DELETE FROM goods");
      }

      // 货品表字段映射 - 包含所有字段
      const stmt = db.prepare(`
        INSERT INTO goods (
          change, launch_status, launch_month, delisting_month, category,
          article_code, tu, product_name_en, product_name_cn, cn_registration,
          declared_content, cn_current_price, ean_code, collation, shelf_life,
          net_weight, item_size, country_of_origin, retail, digital, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(article_code, tu) DO UPDATE SET
          change = excluded.change,
          launch_status = excluded.launch_status,
          launch_month = excluded.launch_month,
          delisting_month = excluded.delisting_month,
          category = excluded.category,
          product_name_en = excluded.product_name_en,
          product_name_cn = excluded.product_name_cn,
          cn_registration = excluded.cn_registration,
          declared_content = excluded.declared_content,
          cn_current_price = excluded.cn_current_price,
          ean_code = excluded.ean_code,
          collation = excluded.collation,
          shelf_life = excluded.shelf_life,
          net_weight = excluded.net_weight,
          item_size = excluded.item_size,
          country_of_origin = excluded.country_of_origin,
          retail = excluded.retail,
          digital = excluded.digital,
          updated_at = excluded.updated_at
      `);

      for (const row of data) {
        const articleCode = row["Article Code"] || row["商品代码"] || "";
        const tu = row["TU"] || row["贸易单位"] || "";

        if (articleCode && tu) {
          stmt.run([
            row["Change"] || "",
            row["Launch Status"] || "",
            row["Launch Month"] || "",
            row["Delisting Month"] || "",
            row["Category "] || row["Category"] || row["类别"] || "",
            String(articleCode),
            String(tu),
            row["Product name (EN)"] || row["商品英文名称"] || "",
            row["Product Name (CN)"] || row["商品中文名称"] || "",
            row["CN Registration "] || row["CN Registration"] || "",
            row["Declared Content"] || row["商品内容信息"] || "",
            parseFloat(row["CN Current Price"] || row["中国现价"] || 0) || 0,
            row["EAN Code"] || "",
            row["Collation"] || "",
            row["Shelf Life"] || row["保质期"] || "",
            row["Net Weight Product (kg)"] || row["净重"] || "",
            row["Item Size L x W x H (mm)"] || row["商品尺寸"] || "",
            row["Country of Origin"] || row["原产国"] || "",
            row["Retail"] || "",
            row["Digital"] || "",
            now,
          ]);
        }
      }
      stmt.free();
    } else if (type === "inventory") {
      // 如果是覆盖模式，先清空库存表
      if (mode === "overwrite") {
        db.run("DELETE FROM inventory");
      }

      // 库存表字段映射 - 包含所有字段
      const stmt = db.prepare(`
        INSERT INTO inventory (
          reporting_date, itm_articleid, itm_dg_chemicals, itm_dg_class_cn,
          storerkey, facility, inventory_type, main_rituals, busr8,
          sku, sku_descr, extendedfield01, batch_code, expiry_date,
          remaining_months, remaining_days, qty, qty_allocated, qty_picked,
          qty_available, hold_status, ciq, pk, inv_id, lot, sscc,
          receipt_date, alt_sku, loc, virtual_sku, tu_shelf_life,
          article_shelf_life, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of data) {
        const sku = row["SKU"] || row["库存单位"] || "";

        if (sku) {
          stmt.run([
            row["Reporting Date"] || "",
            row["itm_articleid"] || "",
            row["itm_dg_chemicals"] || "",
            row["itm_dg_class_cn"] || "",
            row["STORERKEY"] || "",
            row["FACILITY"] || "",
            row["Inventory Type"] || "",
            row["Main Rituals"] || "",
            row["Busr8"] || "",
            String(sku),
            row["SKUDescr"] || "",
            row["Extendedfield01"] || "",
            row["BatchCode"] || "",
            row["expiry date"] || "",
            parseInt(row["效期剩余月数"] || 0) || 0,
            parseInt(row["效期剩余天数"] || 0) || 0,
            parseInt(row["Qty"] || 0) || 0,
            parseInt(row["QtyAllocated"] || 0) || 0,
            parseInt(row["QtyPicked"] || 0) || 0,
            parseInt(row["QTYavailable"] || row["可用数量"] || 0) || 0,
            row["holdstatus"] || "",
            row["CIQ"] || "",
            row["PK"] || "",
            row["ID"] || "",
            row["LOT"] || "",
            row["SSCC"] || "",
            row["Receipt Date"] || "",
            row["ALTSKU"] || "",
            row["LOC"] || "",
            row["虚拟SKU"] || row["虚拟 SKU"] || "",
            row["Tu效期"] || row["Tu 效期"] || "",
            row["A码效期"] || row["A 码效期"] || "",
            now,
          ]);
        }
      }
      stmt.free();
    }

    db.run("COMMIT");
    saveDB();
    return { success: true, count: data.length };
  } catch (error) {
    console.error("========== Import Error ==========");
    console.error("Error Type:", type);
    console.error("File Path:", filePath);
    console.error("Mode:", mode);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("==================================");
    if (db) {
      try {
        db.run("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }
    return { success: false, error: error.message };
  }
});

// 使用 products_view 视图
ipcMain.handle(
  "db:search-products",
  async (
    event,
    query,
    page = 1,
    pageSize = 20,
    sortProp = "",
    sortOrder = "",
    filterZeroStock = false,
    filterNoInfo = false
  ) => {
    try {
      let sql = "SELECT * FROM products_view WHERE 1=1";
      let countSql = "SELECT COUNT(*) as total FROM products_view WHERE 1=1";
      const params = [];

      if (query) {
        const whereClause =
          " AND (product_name_en LIKE ? OR product_name_cn LIKE ? OR article_code LIKE ? OR tu LIKE ?)";
        sql += whereClause;
        countSql += whereClause;
        params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
      }

      if (filterZeroStock) {
        sql += " AND (qty_available IS NULL OR qty_available > 0)";
        countSql += " AND (qty_available IS NULL OR qty_available > 0)";
      }

      if (filterNoInfo) {
        sql +=
          " AND NOT ((product_name_en IS NULL OR product_name_en = '') AND (product_name_cn IS NULL OR product_name_cn = ''))";
        countSql +=
          " AND NOT ((product_name_en IS NULL OR product_name_en = '') AND (product_name_cn IS NULL OR product_name_cn = ''))";
      }

      if (sortProp && sortOrder) {
        const direction = sortOrder === "ascending" ? "ASC" : "DESC";
        sql += ` ORDER BY ${sortProp} ${direction}`;
      }

      const offset = (page - 1) * pageSize;
      sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

      const countStmt = db.prepare(countSql);
      countStmt.bind(params);
      let total = 0;
      if (countStmt.step()) {
        total = countStmt.getAsObject().total;
      }
      countStmt.free();

      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      return { list: results, total };
    } catch (error) {
      console.error("Search error:", error);
      return { list: [], total: 0 };
    }
  }
);

ipcMain.handle("db:create-bundle", async (event, bundleData) => {
  try {
    const { name, startDate, endDate, items, totalValue } = bundleData;
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const dateStr = dayjs().format("YYYYMMDD");
    const countResult = db.exec(
      `SELECT COUNT(*) as count FROM bundles WHERE virtual_code LIKE 'BD${dateStr}%'`
    );
    const count = countResult[0].values[0][0];
    const sequence = String(count + 1).padStart(3, "0");
    const virtualCode = `BD${dateStr}${sequence}`;

    db.run("BEGIN TRANSACTION");

    db.run(
      "INSERT INTO bundles (virtual_code, name, start_date, end_date, total_value, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [virtualCode, name, startDate, endDate, totalValue, "有效", now]
    );

    const bundleIdResult = db.exec("SELECT last_insert_rowid()");
    const bundleId = bundleIdResult[0].values[0][0];

    const stmt = db.prepare(
      "INSERT INTO bundle_items (bundle_id, product_id, type, quantity) VALUES (?, ?, ?, ?)"
    );
    for (const item of items) {
      stmt.run([bundleId, item.id, item.type, 1]); // 使用 product id
    }
    stmt.free();

    db.run("COMMIT");
    saveDB();
    return { success: true, virtualCode };
  } catch (error) {
    console.error("Create bundle error:", error);
    if (db) db.run("ROLLBACK");
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:get-bundles", async (event, filters) => {
  try {
    let sql = "SELECT * FROM bundles WHERE 1=1";
    const params = [];
    if (filters.keyword) {
      sql += " AND (name LIKE ? OR virtual_code LIKE ?)";
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    sql += " ORDER BY created_at DESC";

    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error("Get bundles error:", error);
    return [];
  }
});

ipcMain.handle("db:delete-bundle", async (event, id) => {
  try {
    db.run("DELETE FROM bundles WHERE id = ?", [id]);
    db.run("DELETE FROM bundle_items WHERE bundle_id = ?", [id]);
    saveDB();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 使用 goods 表获取统计信息
ipcMain.handle("db:get-stats", async () => {
  try {
    const countRes = db.exec("SELECT COUNT(*) FROM goods");
    const count = countRes[0] ? countRes[0].values[0][0] : 0;

    const inventoryCountRes = db.exec("SELECT COUNT(*) FROM inventory");
    const inventoryCount = inventoryCountRes[0]
      ? inventoryCountRes[0].values[0][0]
      : 0;

    const timeRes = db.exec("SELECT MAX(updated_at) FROM goods");
    const lastUpdate = timeRes[0] ? timeRes[0].values[0][0] : null;

    return { count, inventoryCount, lastUpdate };
  } catch (error) {
    return { count: 0, inventoryCount: 0, lastUpdate: null };
  }
});

ipcMain.handle("db:export-bundles", async () => {
  return { success: true };
});

ipcMain.handle("db:export-products", async () => {
  try {
    const stmt = db.prepare(
      "SELECT * FROM products_view ORDER BY category, article_code"
    );
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        Category: row.category,
        "Article Code": row.article_code,
        TU: row.tu,
        "Product Name (EN)": row.product_name_en,
        "Product Name (CN)": row.product_name_cn,
        "Declared Content": row.declared_content,
        "CN Current Price": row.cn_current_price,
        "Shelf Life": row.shelf_life,
        "Net Weight Product (kg)": row.net_weight,
        "Item Size L x W x H (mm)": row.item_size,
        "Country of Origin": row.country_of_origin,
        "Qty Available": row.qty_available || 0,
      });
    }
    stmt.free();

    const ws = xlsx.utils.json_to_sheet(results);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Products");

    // 选择保存位置
    const { filePath } = await dialog.showSaveDialog({
      title: "导出商品数据",
      defaultPath: `products_view_export_${dayjs().format(
        "YYYYMMDD_HHmmss"
      )}.xlsx`,
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });

    if (filePath) {
      xlsx.writeFile(wb, filePath);
      return { success: true, filePath, count: results.length };
    } else {
      return { success: false, error: "用户取消了保存" };
    }
  } catch (error) {
    console.error("Export error:", error);
    return { success: false, error: error.message };
  }
});

// 导出货品表（数据库表）
ipcMain.handle("db:export-goods", async () => {
  try {
    const stmt = db.prepare("SELECT * FROM goods");
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        Change: row.change,
        "Launch Status": row.launch_status,
        "Launch Month": row.launch_month,
        "Delisting Month": row.delisting_month,
        "Category ": row.category,
        "Article Code": row.article_code,
        TU: row.tu,
        "Product name (EN)": row.product_name_en,
        "Product Name (CN)": row.product_name_cn,
        "CN Registration ": row.cn_registration,
        "Declared Content": row.declared_content,
        "CN Current Price": row.cn_current_price,
        "EAN Code": row.ean_code,
        Collation: row.collation,
        "Shelf Life": row.shelf_life,
        "Net Weight Product (kg)": row.net_weight,
        "Item Size L x W x H (mm)": row.item_size,
        "Country of Origin": row.country_of_origin,
        Retail: row.retail,
        Digital: row.digital,
      });
    }
    stmt.free();

    const ws = xlsx.utils.json_to_sheet(results);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Goods");

    const { filePath } = await dialog.showSaveDialog({
      title: "导出货品表",
      defaultPath: `goods_export_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });

    if (filePath) {
      xlsx.writeFile(wb, filePath);
      return { success: true, filePath, count: results.length };
    } else {
      return { success: false, error: "用户取消了保存" };
    }
  } catch (error) {
    console.error("Export goods error:", error);
    return { success: false, error: error.message };
  }
});

// 导出库存表
ipcMain.handle("db:export-inventory", async () => {
  try {
    const stmt = db.prepare("SELECT * FROM inventory");
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        "Reporting Date": row.reporting_date,
        itm_articleid: row.itm_articleid,
        itm_dg_chemicals: row.itm_dg_chemicals,
        itm_dg_class_cn: row.itm_dg_class_cn,
        STORERKEY: row.storerkey,
        FACILITY: row.facility,
        "Inventory Type": row.inventory_type,
        "Main Rituals": row.main_rituals,
        Busr8: row.busr8,
        SKU: row.sku,
        SKUDescr: row.sku_descr,
        Extendedfield01: row.extendedfield01,
        BatchCode: row.batch_code,
        "expiry date": row.expiry_date,
        效期剩余月数: row.remaining_months,
        效期剩余天数: row.remaining_days,
        Qty: row.qty,
        QtyAllocated: row.qty_allocated,
        QtyPicked: row.qty_picked,
        QTYavailable: row.qty_available,
        holdstatus: row.hold_status,
        CIQ: row.ciq,
        PK: row.pk,
        ID: row.inv_id,
        LOT: row.lot,
        SSCC: row.sscc,
        "Receipt Date": row.receipt_date,
        ALTSKU: row.alt_sku,
        LOC: row.loc,
        虚拟SKU: row.virtual_sku,
        Tu效期: row.tu_shelf_life,
        A码效期: row.article_shelf_life,
      });
    }
    stmt.free();

    const ws = xlsx.utils.json_to_sheet(results);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Inventory");

    // 选择保存位置
    const { filePath } = await dialog.showSaveDialog({
      title: "导出库存表",
      defaultPath: `inventory_export_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
    });

    if (filePath) {
      xlsx.writeFile(wb, filePath);
      return { success: true, filePath, count: results.length };
    } else {
      return { success: false, error: "用户取消了保存" };
    }
  } catch (error) {
    console.error("Export inventory error:", error);
    return { success: false, error: error.message };
  }
});

// 清空货品表
ipcMain.handle("db:clear-goods", async () => {
  try {
    db.run("DELETE FROM goods");
    saveDB();
    return { success: true };
  } catch (error) {
    console.error("Clear goods error:", error);
    return { success: false, error: error.message };
  }
});

// 清空库存表
ipcMain.handle("db:clear-inventory", async () => {
  try {
    db.run("DELETE FROM inventory");
    saveDB();
    return { success: true };
  } catch (error) {
    console.error("Clear inventory error:", error);
    return { success: false, error: error.message };
  }
});
