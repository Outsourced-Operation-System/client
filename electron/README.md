# Electron 后端工程化架构

## 目录结构

```
electron/
├── main.cjs                  # 应用主入口（简化至 50+ 行）
├── preload.js               # 预加载脚本，暴露安全 IPC 接口
├── database/                # 数据库模块
│   └── index.cjs           # 数据库初始化、表结构管理、连接管理
└── handlers/                # IPC 处理器模块（按功能划分）
    ├── index.cjs           # 统一注册所有 handlers
    ├── productHandlers.cjs # 产品查询相关操作
    ├── bundleHandlers.cjs  # 货组管理相关操作
    ├── dataHandlers.cjs    # 数据导入导出操作
    └── statsHandlers.cjs   # 统计信息操作
```

## 模块详解

### 1️. main.cjs - 应用主入口

**职责**：

- 创建和管理应用窗口
- 管理应用生命周期（启动、关闭、更新）
- 初始化数据库连接
- 注册所有 IPC handlers
- 配置窗口参数和开发工具

**核心代码**：

```javascript
const { app, BrowserWindow } = require("electron");
const { initDatabase } = require("./database/index.cjs");
const { registerAllHandlers } = require("./handlers/index.cjs");

app.whenReady().then(() => {
  initDatabase(); // 初始化数据库
  registerAllHandlers(); // 注册所有 IPC handlers
  createWindow(); // 创建窗口
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

---

### 2️. database/index.cjs - 数据库管理

**职责**：

- 初始化 SQLite 数据库连接
- 创建和管理数据表
- 创建数据库视图
- 提供数据库实例访问接口

**导出方法**：

| 方法                | 说明                 | 用途                   |
| ------------------- | -------------------- | ---------------------- |
| `initDatabase()`    | 初始化数据库         | 应用启动时调用         |
| `getDatabase()`     | 获取数据库实例       | handlers 中使用        |
| `getDatabasePath()` | 获取数据库文件路径   | 诊断、备份时使用       |
| `reinitDatabase()`  | 重新初始化数据库连接 | 导入后重建连接（可选） |
| `closeDatabase()`   | 关闭数据库连接       | 应用退出时调用         |

**数据表结构**：

```sql
-- 货品表（原 goods 表，重命名为 products）
CREATE TABLE products (
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

-- 库存表
CREATE TABLE inventory (
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

-- 标签表
CREATE TABLE labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  product_type TEXT,
  by_sku TEXT,
  fragrance TEXT,
  updated_at TEXT
);

-- 货组表
CREATE TABLE bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  virtual_code TEXT UNIQUE,
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

-- 货组明细表
CREATE TABLE bundle_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER,
  sku TEXT,
  article_code TEXT,
  tu TEXT,
  product_name_cn TEXT,
  product_name_en TEXT,
  cn_current_price REAL,
  qty_available INTEGER,
  tu_shelf_life TEXT,
  declared_content TEXT,
  type TEXT,
  quantity INTEGER DEFAULT 1
);

-- 库存聚合视图
CREATE VIEW inventory_aggregated_view AS
  SELECT
    sku,
    itm_articleid,
    extendedfield01,
    sku_descr,
    SUM(qty_available) AS total_qty_available,
    MAX(remaining_months) AS remaining_months
  FROM inventory
  GROUP BY sku, itm_articleid, extendedfield01, sku_descr;

-- goods 视图（库存 + 货品聚合，三层匹配优先级）
CREATE VIEW goods AS
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
  );
```

---

### 3️. handlers/productHandlers.cjs - 产品查询

**IPC Channels**：

| Channel                         | 参数                                          | 返回值                | 说明                 |
| ------------------------------- | --------------------------------------------- | --------------------- | -------------------- |
| `db:search-products`            | `{ keyword, page, pageSize, showOutOfStock }` | `{ products, total }` | 产品搜索（分页）     |
| `db:search-product-suggestions` | `{ keyword }`                                 | `Array<string>`       | 搜索建议（自动补全） |
| `db:search-products-by-types`   | `{ types }`                                   | `Array<Product>`      | 按 TU 批量查询       |

---

### 4️. handlers/bundleHandlers.cjs - 货组管理

**核心 IPC Channels（简要）**：

| Channel                       | 参数说明                                                                        | 返回值结构                                   | 主要用途                           |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------- | ------------------------- |
| `db:check-bundle-name-exists` | `name: string`                                                                  | `{ success, exists }`                        | 检查货组名称是否已存在             |
| `db:check-stock-availability` | `items: { sku, article_code, product_name_cn }[]`                               | `{ success, sufficient, insufficientItems }` | 校验新增商品库存是否充足           |
| `db:create-bundle`            | `bundleData`（名称、虚拟编码、标签、用途、明细等）                              | `{ success, virtualCode, error? }`           | 创建货组并扣减库存                 |
| `db:get-bundles`              | `filters`（分页、时间、状态、用途、分类等）                                     | `{ data, total, page, pageSize }`            | 获取货组列表                       |
| `db:get-bundle-detail`        | `bundleId: number`                                                              | `{ success, data: { bundle + items[] } }`    | 获取单个货组及其商品明细           |
| `db:update-bundle`            | `bundleData`（名称、结束日期、用途、标签、状态）                                | `{ success, error? }`                        | 更新货组基础信息                   |
| `db:update-bundle-items`      | `{ bundleId, items, totalValue, mainValue, giftValue, addedSkus, removedSkus }` | `{ success, error? }`                        | 更新货组商品明细与货值，并同步库存 |
| `db:update-bundle-status`     | `id: number, status: string`                                                    | `{ success, error? }`                        | 修改货组状态（有效/失效等）        |
| `db:get-today-bundle-count`   | `-`                                                                             | `{ count }`                                  | 获取当天已生成货组数量             |
| `db:delete-bundle`            | `id: number`                                                                    | `{ success, error? }`                        | 删除单个货组并还原库存             |
| `db:batch-delete-bundles`     | `ids: number[]`                                                                 | `{ success, count, error? }`                 | 批量删除货组并还原库存             |
| `db:batch-export-bundles`     | `ids: number[], exportType: 'sku'                                               | 'virtual'`                                   | `{ success, canceled?, error? }`   | 批量导出 SKU/虚拟组套表格 |

**货组创建与编辑流程（概要）**：

- **创建货组（`db:create-bundle`）**：

  1. 从 `goods` 表读取商品信息（保质期、规格、净含量、原产国等）及当前库存。
  2. 为每个加入货组的 SKU 查找一条可用的 `inventory` 记录，写入 `bundle_items.inventory_id`，并扣减 `inventory.qty_available`。
  3. 写入 `bundles` 主表（虚拟编码、名称、用途、标签、货值等）和 `bundle_items` 明细表（包含当时的库存、保质期、规格尺寸等快照）。

- **编辑货组（`db:get-bundle-detail` + `db:update-bundle` + `db:update-bundle-items`）**：
  1. 通过 `db:get-bundle-detail` 读取货组详情：
     - 明细从 `bundle_items` 读取；
     - 通过 LEFT JOIN `goods` 获取最新库存，并用最新的 `qty_available` 覆盖历史快照，保证「商品编辑」页面库存与 `goods` 当前数据一致。
  2. 前端在「商品编辑」页面调整主品/赠品、移除或新增商品时，计算新增 SKU 与删除 SKU 集合：
     - 对删除商品：根据旧的 `bundle_items.inventory_id` 归还对应 `inventory` 记录的库存；
     - 对新增商品：为每个 SKU 再次占用一条 `inventory` 记录并扣减库存；
     - 对保留商品：继续沿用原有 `inventory_id`，不会重复扣减库存。
  3. 通过 `db:update-bundle-items` 写回最新明细与 `bundles` 表中的 `total_value/main_value/gift_value`。

---

### 5️. handlers/dataHandlers.cjs - 数据导入导出

**IPC Channels**：

| Channel                   | 参数说明               | 返回值               | 说明                         |
| ------------------------- | ---------------------- | -------------------- | ---------------------------- |
| `db:import-data`          | `type, filePath, mode` | `{ success, count }` | 导入货品/库存/标签（含覆盖） |
| `db:get-stats`            | -                      | `{ count, ... }`     | 获取当前数据统计             |
| `db:export-products`      | -                      | `{ success }`        | 导出货品表                   |
| `db:export-inventory`     | -                      | `{ success }`        | 导出库存表                   |
| `db:export-labels`        | -                      | `{ success }`        | 导出标签表                   |
| `db:clear-products`       | -                      | `{ success }`        | 清空货品数据                 |
| `db:clear-inventory`      | -                      | `{ success }`        | 清空库存数据                 |
| `db:backup-database`      | -                      | `{ success }`        | 备份数据库文件               |
| `db:get-backups`          | -                      | `Array<Backup>`      | 获取备份列表                 |
| `db:restore-backup`       | `timestamp`            | `{ success }`        | 从指定备份恢复               |
| `db:delete-backup`        | `timestamp`            | `{ success }`        | 删除指定备份                 |
| `db:get-last-backup-time` | -                      | `{ datetime }`       | 获取最近一次备份时间         |
| `db:search-labels`        | `field, keyword`       | `Array<string>`      | 标签模糊搜索                 |
| `db:get-label-values`     | `field`                | `Array<string>`      | 获取单字段全部标签值         |
| `db:get-all-labels`       | -                      | `Array<Label>`       | 获取所有标签记录             |
| `db:add-label`            | `field, value`         | `{ success }`        | 新增标签                     |
| `db:delete-label`         | `field, value`         | `{ success }`        | 删除标签                     |

**支持格式**：

- 导入：`.xlsx`, `.xls`, `.csv`
- 导出：`.xlsx`

## 架构优势

| 优势           | 说明                              | 效果           |
| -------------- | --------------------------------- | -------------- |
| **职责分离**   | 每个模块只负责特定功能            | 代码清晰易懂   |
| **易于维护**   | 代码按功能组织                    | 快速定位和修改 |
| **可扩展性**   | 添加新功能只需新增文件            | 不影响现有代码 |
| **代码复用**   | 通过 `getDatabase()` 统一获取实例 | 避免重复代码   |
| **降低复杂度** | 主文件从 800+ 行降至 50+ 行       | 提高可读性     |
| **易于测试**   | 模块独立，便于单元测试            | 提高代码质量   |

## 设计模式

### 1. 单一职责原则（SRP）

每个模块只负责一个功能领域

### 2. 依赖注入

通过 `getDatabase()` 获取数据库实例，而非直接创建

### 3. 工厂模式

`registerAllHandlers()` 统一创建和注册所有 handlers

### 4. 模块化封装

将相关功能封装在独立模块中

## 相关文档

- [项目总览](../README.md)
- [Vue 前端架构](../src/README.md)
- [Electron 官方文档](https://www.electronjs.org/docs)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
