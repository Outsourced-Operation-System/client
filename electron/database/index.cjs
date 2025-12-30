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
      quantity INTEGER DEFAULT 1,
      inventory_id INTEGER
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

  // 商品视图 - 聚合商品信息（原来是表，现改为视图）
  db.exec(`CREATE VIEW IF NOT EXISTS goods AS
    -- 优先级1: 从库存表出发匹配货品表(TU码匹配)
    SELECT
      i.sku AS sku,
      p.id AS product_id,
      p.category AS category,
      p.article_code AS article_code,
      p.tu AS tu,
      p.product_name_en AS product_name_en,
      p.product_name_cn AS product_name_cn,
      p.declared_content AS declared_content,
      p.cn_current_price AS cn_current_price,
      p.shelf_life AS shelf_life,
      p.net_weight AS net_weight,
      p.item_size AS item_size,
      p.country_of_origin AS country_of_origin,
      i.total_qty_available AS qty_available,
      i.remaining_months AS remaining_months,
      p.updated_at AS updated_at
    FROM inventory_aggregated_view i
    INNER JOIN products p ON TRIM(p.tu) = TRIM(i.sku)

    UNION ALL

    -- 优先级2: 从库存表出发匹配货品表(A码+中文品名匹配,多个取第一个)
    SELECT
      i.sku AS sku,
      p.id AS product_id,
      p.category AS category,
      p.article_code AS article_code,
      p.tu AS tu,
      p.product_name_en AS product_name_en,
      p.product_name_cn AS product_name_cn,
      p.declared_content AS declared_content,
      p.cn_current_price AS cn_current_price,
      p.shelf_life AS shelf_life,
      p.net_weight AS net_weight,
      p.item_size AS item_size,
      p.country_of_origin AS country_of_origin,
      i.total_qty_available AS qty_available,
      i.remaining_months AS remaining_months,
      p.updated_at AS updated_at
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
      SELECT 1 FROM products p2 WHERE TRIM(p2.tu) = TRIM(i.sku)
    )

    UNION ALL

    -- 优先级3: 库存表中找不到对应货品的记录
    SELECT
      i.sku AS sku,
      NULL AS product_id,
      '-' AS category,
      i.itm_articleid AS article_code,
      i.sku AS tu,
      i.sku_descr AS product_name_en,
      i.extendedfield01 AS product_name_cn,
      '-' AS declared_content,
      0 AS cn_current_price,
      '-' AS shelf_life,
      '-' AS net_weight,
      '-' AS item_size,
      '-' AS country_of_origin,
      i.total_qty_available AS qty_available,
      i.remaining_months AS remaining_months,
      NULL AS updated_at
    FROM inventory_aggregated_view i
    WHERE NOT EXISTS (
      SELECT 1 FROM products p WHERE TRIM(p.tu) = TRIM(i.sku)
    )
    AND NOT EXISTS (
      SELECT 1 FROM products p
      WHERE p.article_code = i.itm_articleid
        AND p.product_name_cn = i.extendedfield01
    )
  `);
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
};
