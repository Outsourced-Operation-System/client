const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;
let dbPath = null;

function getDatabasePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath("userData"), "bundle.db");
  }
  return dbPath;
}

function initDatabase() {
  try {
    dbPath = getDatabasePath();
    db = new Database(dbPath);

    // 启用 WAL 模式以提高性能
    db.pragma("journal_mode = WAL");

    createTables();

    console.log("Database initialized successfully");
    return db;
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}

function createTables() {
  // 货品表 - 包含所有货品信息字段
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
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
  `);

  // 库存表 - 包含所有库存信息字段
  db.exec(`
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
  `);

  // Bundles 表 - 货组主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      virtual_code TEXT,
      name TEXT,
      created_at TEXT,
      end_date TEXT,
      usage_type TEXT,
      total_value REAL,
      main_value REAL,
      gift_value REAL,
      category TEXT,
      product_type TEXT,
      by_sku TEXT,
      fragrance TEXT,
      status TEXT DEFAULT '有效'
    );
  `);

  // Bundle Items 表 - 货组明细表（直接存储商品信息，无外键约束）
  db.exec(`
    CREATE TABLE IF NOT EXISTS bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id INTEGER,
      sku TEXT,
      article_code TEXT,
      tu TEXT,
      product_name_cn TEXT,
      product_name_en TEXT,
      cn_current_price REAL,
      qty_available INTEGER,
      remaining_months TEXT,
      declared_content TEXT,
      type TEXT,
      quantity INTEGER DEFAULT 1
    );
  `);

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      product_type TEXT,
      by_sku TEXT,
      fragrance TEXT,
      updated_at TEXT
    );
  `);

  // 商品表 - 聚合商品信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS goods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT,
      product_id INTEGER,
      category TEXT,
      article_code TEXT,
      tu TEXT,
      product_name_en TEXT,
      product_name_cn TEXT,
      declared_content TEXT,
      cn_current_price REAL,
      shelf_life TEXT,
      net_weight TEXT,
      item_size TEXT,
      country_of_origin TEXT,
      qty_available INTEGER DEFAULT 0,
      remaining_months TEXT,
      updated_at TEXT,
      UNIQUE(sku)
    );
  `);

  // 库存表聚合视图
  db.exec(`CREATE VIEW IF NOT EXISTS inventory_aggregated_view AS
          SELECT 
            sku,
            itm_articleid,
            extendedfield01,
            sku_descr,
            SUM(qty_available) AS total_qty_available,
            MAX(remaining_months) AS remaining_months
          FROM inventory
          GROUP BY sku, itm_articleid, extendedfield01, sku_descr;
  `);

  // 初始化时刷新 goods 表
  refreshGoodsTable();
}

// 库存表或货品表更新后，刷新 goods 表
function refreshGoodsTable() {
  try {
    // 清空 goods 表
    db.exec(`DELETE FROM goods;`);

    // 重新插入数据
    db.exec(`
      INSERT INTO goods (sku, product_id, category, article_code, tu, product_name_en, product_name_cn, declared_content, cn_current_price, shelf_life, net_weight, item_size, country_of_origin, qty_available, remaining_months, updated_at)
      -- 优先级1: 从库存表出发匹配货品表(TU码匹配)
      SELECT
        i.sku,
        p.id,
        p.category,
        p.article_code,
        p.tu,
        p.product_name_en,
        p.product_name_cn,
        p.declared_content,
        p.cn_current_price,
        p.shelf_life,
        p.net_weight,
        p.item_size,
        p.country_of_origin,
        i.total_qty_available,
        i.remaining_months,
        p.updated_at
      FROM inventory_aggregated_view i
      INNER JOIN products p ON TRIM(p.tu) = TRIM(i.sku);
    `);

    db.exec(`
      INSERT INTO goods (sku, product_id, category, article_code, tu, product_name_en, product_name_cn, declared_content, cn_current_price, shelf_life, net_weight, item_size, country_of_origin, qty_available, remaining_months, updated_at)
      -- 优先级2: 从库存表出发匹配货品表(A码+中文品名匹配,多个取第一个)
      SELECT
        i.sku,
        p.id,
        p.category,
        p.article_code,
        p.tu,
        p.product_name_en,
        p.product_name_cn,
        p.declared_content,
        p.cn_current_price,
        p.shelf_life,
        p.net_weight,
        p.item_size,
        p.country_of_origin,
        i.total_qty_available,
        i.remaining_months,
        p.updated_at
      FROM inventory_aggregated_view i
      INNER JOIN (
        SELECT 
          article_code,
          product_name_cn,
          MIN(id) as id
        FROM products
        GROUP BY article_code, product_name_cn
      ) p_min ON p_min.article_code = i.itm_articleid 
             AND p_min.product_name_cn = i.extendedfield01
      INNER JOIN products p ON p.id = p_min.id
      WHERE NOT EXISTS (
        SELECT 1 FROM products p2 WHERE p2.tu = i.sku
      )
      AND NOT EXISTS (
        SELECT 1 FROM goods g WHERE g.sku = i.sku
      );
    `);

    db.exec(`
      INSERT INTO goods (sku, product_id, category, article_code, tu, product_name_en, product_name_cn, declared_content, cn_current_price, shelf_life, net_weight, item_size, country_of_origin, qty_available, remaining_months, updated_at)
      -- 优先级3: 库存表中找不到对应货品的记录
      SELECT
        i.sku,
        NULL,
        '-',
        i.itm_articleid,
        i.sku,
        i.sku_descr,
        i.extendedfield01,
        '-',
        0,
        '-',
        '-',
        '-',
        '-',
        i.total_qty_available,
        i.remaining_months,
        NULL
      FROM inventory_aggregated_view i
      WHERE NOT EXISTS (
        SELECT 1 FROM products p WHERE p.tu = i.sku
      )
      AND NOT EXISTS (
        SELECT 1 FROM products p
        WHERE p.article_code = i.itm_articleid
          AND p.product_name_cn = i.extendedfield01
      )
      AND NOT EXISTS (
        SELECT 1 FROM goods g WHERE g.sku = i.sku
      );
    `);

    console.log("Goods table refreshed successfully");
  } catch (err) {
    console.error("Failed to refresh goods table:", err);
    throw err;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

// 重新初始化数据库连接
function reinitDatabase() {
  if (db) {
    try {
      db.close();
    } catch (e) {
      console.error("Error closing database:", e);
    }
    db = null;
  }
  return initDatabase();
}

// 关闭数据库连接
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  getDatabasePath,
  reinitDatabase,
  closeDatabase,
  refreshGoodsTable,
};
