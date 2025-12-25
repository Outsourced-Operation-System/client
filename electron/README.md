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

| 方法              | 说明           | 用途            |
| ----------------- | -------------- | --------------- |
| `initDatabase()`  | 初始化数据库   | 应用启动时调用  |
| `getDatabase()`   | 获取数据库实例 | handlers 中使用 |
| `closeDatabase()` | 关闭数据库连接 | 应用退出时调用  |

**数据表结构**：

```sql
-- 货品表
CREATE TABLE goods (
  tu TEXT PRIMARY KEY,
  a_code TEXT,
  product_name TEXT,
  specification TEXT,
  unit TEXT,
  origin_country TEXT,
  product_category TEXT,
  product_line TEXT,
  supplier TEXT,
  brand TEXT,
  price REAL,
  net_value REAL
);

-- 库存表
CREATE TABLE inventory (
  sku TEXT PRIMARY KEY,
  tu TEXT,
  batch_no TEXT,
  expiry_date TEXT,
  available_stock INTEGER
);

-- 货组表
CREATE TABLE bundles (
  virtual_code TEXT PRIMARY KEY,
  bundle_name TEXT,
  start_date TEXT,
  end_date TEXT,
  total_value REAL,
  created_at TEXT,
  updated_at TEXT
);

-- 货组明细表
CREATE TABLE bundle_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  virtual_code TEXT,
  tu TEXT,
  item_type TEXT,  -- 'main' 或 'gift'
  quantity INTEGER,
  FOREIGN KEY (virtual_code) REFERENCES bundles(virtual_code)
);

-- 产品视图（聚合货品和库存）
CREATE VIEW products_view AS
  SELECT g.*, i.available_stock
  FROM goods g
  LEFT JOIN inventory i ON g.tu = i.tu;
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
