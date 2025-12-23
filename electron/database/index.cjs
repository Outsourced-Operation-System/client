const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;
let dbPath = null;

/**
 * 获取数据库路径
 */
function getDatabasePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath("userData"), "bundle.db");
  }
  return dbPath;
}

/**
 * 初始化数据库
 */
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

  // 先删除旧视图再创建新视图（如果存在）
  db.exec("DROP VIEW IF EXISTS products_view");

  // 库存表聚合视图
  db.exec(`CREATE VIEW IF NOT EXISTS inventory_aggregated_view AS
          SELECT 
            sku,
            itm_articleid,
            extendedfield01,
            SUM(qty_available) AS total_qty_available,
            MAX(tu_shelf_life) AS tu_shelf_life
          FROM inventory
          GROUP BY sku, itm_articleid, extendedfield01;
  `);

  // 库存匹配货品视图
  db.exec(`
    CREATE VIEW IF NOT EXISTS inventory_to_goods_view AS
    -- 从库存表出发匹配货品表(TU码匹配)
    SELECT
      i.sku,
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
      i.total_qty_available,
      i.tu_shelf_life,
      g.updated_at,
      1 AS match_priority
    FROM inventory_aggregated_view i
    INNER JOIN goods g ON g.tu = i.sku

    UNION ALL

    -- 从库存表出发匹配货品表(A码+产品名匹配)
    SELECT
      i.sku,
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
      i.total_qty_available,
      i.tu_shelf_life,
      g.updated_at,
      2 AS match_priority
    FROM inventory_aggregated_view i
    INNER JOIN goods g ON g.article_code = i.itm_articleid
                       AND (g.product_name_en = i.extendedfield01 OR g.product_name_cn = i.extendedfield01)
    WHERE NOT EXISTS (
      SELECT 1 FROM goods g2 WHERE g2.tu = i.sku
    )

    UNION ALL

    -- 库存表中找不到对应货品的记录
    SELECT
      i.sku,
      NULL AS id,
      '-' AS category,
      '-' AS article_code,
      i.sku AS tu,
      '-' AS product_name_en,
      i.extendedfield01 AS product_name_cn,
      '-' AS declared_content,
      0 AS cn_current_price,
      '-' AS shelf_life,
      '-' AS net_weight,
      '-' AS item_size,
      '-' AS country_of_origin,
      i.total_qty_available,
      i.tu_shelf_life,
      NULL AS updated_at,
      3 AS match_priority
    FROM inventory_aggregated_view i
    WHERE NOT EXISTS (
      SELECT 1 FROM goods g WHERE g.tu = i.sku
    )
    AND NOT EXISTS (
      SELECT 1 FROM goods g
      WHERE g.article_code = i.itm_articleid
        AND (g.product_name_en = i.extendedfield01 OR g.product_name_cn = i.extendedfield01)
    );
  `);

  // 货品匹配库存视图
  db.exec(`
    CREATE VIEW IF NOT EXISTS goods_to_inventory_view AS
    -- 从货品表出发匹配库存表(TU码匹配)
    SELECT
      g.tu AS sku,
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
      i.total_qty_available,
      i.tu_shelf_life,
      g.updated_at,
      1 AS match_priority
    FROM goods g
    LEFT JOIN inventory_aggregated_view i ON i.sku = g.tu

    UNION ALL

    -- 从货品表出发匹配库存表(A码+产品名匹配)
    SELECT
      g.tu AS sku,
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
      i.total_qty_available,
      i.tu_shelf_life,
      g.updated_at,
      2 AS match_priority
    FROM goods g
    LEFT JOIN inventory_aggregated_view i ON i.itm_articleid = g.article_code
                                     AND (i.extendedfield01 = g.product_name_en OR i.extendedfield01 = g.product_name_cn)
    WHERE NOT EXISTS (
      SELECT 1 FROM inventory_aggregated_view i2 WHERE i2.sku = g.tu
    )
    AND EXISTS (
      SELECT 1 FROM inventory_aggregated_view i3
      WHERE i3.itm_articleid = g.article_code
        AND (i3.extendedfield01 = g.product_name_en OR i3.extendedfield01 = g.product_name_cn)
    )

    UNION ALL

    -- 货品表中找不到对应库存的记录(库存显示0)
    SELECT
      g.tu AS sku,
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
      0 AS total_qty_available,
      '-' AS tu_shelf_life,
      g.updated_at,
      3 AS match_priority
    FROM goods g
    WHERE NOT EXISTS (
      SELECT 1 FROM inventory_aggregated_view i WHERE i.sku = g.tu
    )
    AND NOT EXISTS (
      SELECT 1 FROM inventory_aggregated_view i
      WHERE i.itm_articleid = g.article_code
        AND (i.extendedfield01 = g.product_name_en OR i.extendedfield01 = g.product_name_cn)
    );
  `);

  // 最终产品视图合并
  db.exec(`
    CREATE VIEW IF NOT EXISTS products_view AS
    -- 合并库存匹配货品和货品匹配库存的结果
    WITH all_matches AS (
      SELECT * FROM inventory_to_goods_view
      UNION ALL
      SELECT * FROM goods_to_inventory_view
    )
    -- 对每个唯一的产品(通过id或sku),选择优先级最高的匹配
    SELECT DISTINCT
      id,
      category,
      article_code,
      tu,
      product_name_en,
      product_name_cn,
      declared_content,
      cn_current_price,
      shelf_life,
      net_weight,
      item_size,
      country_of_origin,
      total_qty_available AS qty_available,
      tu_shelf_life,
      updated_at
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(CAST(id AS TEXT), sku)
          ORDER BY match_priority
        ) AS rn
      FROM all_matches
    )
    WHERE rn = 1;
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
 * 重新初始化数据库（用于恢复备份后）
 */
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
  getDatabasePath,
  reinitDatabase,
  closeDatabase,
};
