const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;

/**
 * 初始化数据库
 */
function initDatabase() {
  try {
    const dbPath = path.join(app.getPath("userData"), "bundle.db");
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

/**
 * 创建数据库表
 */
function createTables() {
  // 货品表 - 包含所有货品信息字段
  db.exec(`
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

  // Bundles 表
  db.exec(`
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
  `);

  // Bundle Items 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bundle_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundle_id INTEGER,
      product_id INTEGER,
      type TEXT,
      quantity INTEGER,
      FOREIGN KEY(bundle_id) REFERENCES bundles(id),
      FOREIGN KEY(product_id) REFERENCES goods(id)
    );
  `);

  // 先删除旧视图再创建新视图（如果存在）
  db.exec("DROP VIEW IF EXISTS products_view");

  // 产品视图 - 从货品表和库存表中提取数据，使用 TU 和 SKU 关联
  db.exec(`
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
  `);
}

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
};
