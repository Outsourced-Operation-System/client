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
const { initDatabase, closeDatabase } = require("./database");
const { registerAllHandlers } = require("./handlers");

app.whenReady().then(() => {
  initDatabase(); // 初始化数据库
  registerAllHandlers(); // 注册所有 IPC handlers
  createWindow(); // 创建窗口
});

app.on("window-all-closed", () => {
  closeDatabase(); // 关闭数据库连接
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

| 方法                  | 说明              | 用途            |
| --------------------- | ----------------- | --------------- |
| `initDatabase()`      | 初始化数据库      | 应用启动时调用  |
| `getDatabase()`       | 获取数据库实例    | handlers 中使用 |
| `closeDatabase()`     | 关闭数据库连接    | 应用退出时调用  |
| `refreshGoodsTable()` | 刷新 goods 聚合表 | 数据更新时调用  |

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
  sku TEXT,
  sku_descr TEXT,
  extendedfield01 TEXT,
  batch_code TEXT,
  expiry_date TEXT,
  qty_available INTEGER DEFAULT 0,
  tu_shelf_life TEXT,
  updated_at TEXT
  -- 其他字段略
);

-- goods 聚合表（原 products_view 视图，改为独立表）
-- 当 products 或 inventory 表更新时自动刷新
CREATE TABLE goods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
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
  tu_shelf_life TEXT,
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
    MAX(tu_shelf_life) AS tu_shelf_life
  FROM inventory
  GROUP BY sku, itm_articleid, extendedfield01, sku_descr;
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

**IPC Channels**：

| Channel            | 参数                                        | 返回值                        | 说明         |
| ------------------ | ------------------------------------------- | ----------------------------- | ------------ |
| `db:create-bundle` | `{ bundleName, startDate, endDate, items }` | `{ virtualCode, totalValue }` | 创建货组     |
| `db:get-bundles`   | `{ page, pageSize, filters }`               | `{ bundles, total }`          | 获取货组列表 |
| `db:delete-bundle` | `{ virtualCode }`                           | `{ success }`                 | 删除货组     |

**货组创建流程**：

1. 生成虚拟编码（`BDL-{timestamp}`）
2. 计算总货值
3. 插入 `bundles` 表
4. 插入 `bundle_items` 表（批量）
5. 返回结果

---

### 5️. handlers/dataHandlers.cjs - 数据导入导出

**IPC Channels**：

| Channel               | 参数                 | 返回值               | 说明          |
| --------------------- | -------------------- | -------------------- | ------------- |
| `db:import-data`      | `{ type, filePath }` | `{ success, count }` | 导入货品/库存 |
| `db:export-products`  | `{ filePath }`       | `{ success }`        | 导出产品视图  |
| `db:export-goods`     | `{ filePath }`       | `{ success }`        | 导出货品表    |
| `db:export-inventory` | `{ filePath }`       | `{ success }`        | 导出库存表    |
| `db:export-bundles`   | `{ filePath }`       | `{ success }`        | 导出货组      |
| `db:clear-goods`      | -                    | `{ success }`        | 清空货品表    |
| `db:clear-inventory`  | -                    | `{ success }`        | 清空库存表    |

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
