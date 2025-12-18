# Electron 后端工程化结构

## 目录结构

```
electron/
├── main.cjs                  # 应用主入口（简化后）
├── preload.js               # 预加载脚本
├── database/                # 数据库模块
│   └── index.js            # 数据库初始化和表结构管理
└── handlers/                # IPC 处理器模块
    ├── index.js            # 统一注册所有 handlers
    ├── productHandlers.js  # 产品相关操作
    ├── bundleHandlers.js   # 货组相关操作
    ├── dataHandlers.js     # 数据导入导出操作
    └── statsHandlers.js    # 统计信息操作
```

## 模块说明

### main.cjs

应用主入口文件，职责：

- 创建应用窗口
- 初始化数据库
- 注册 IPC handlers
- 管理应用生命周期

### database/index.js

数据库管理模块，职责：

- 数据库连接初始化
- 创建表和视图
- 提供数据库实例访问

导出方法：

- `initDatabase()` - 初始化数据库
- `getDatabase()` - 获取数据库实例
- `closeDatabase()` - 关闭数据库连接

### handlers/productHandlers.js

产品查询相关的 IPC handlers：

- `db:search-products` - 产品搜索（分页）
- `db:search-product-suggestions` - 搜索建议
- `db:search-products-by-types` - 按类型搜索产品

### handlers/bundleHandlers.js

货组管理相关的 IPC handlers：

- `db:create-bundle` - 创建货组
- `db:get-bundles` - 获取货组列表
- `db:delete-bundle` - 删除货组

### handlers/dataHandlers.js

数据导入导出相关的 IPC handlers：

- `db:import-data` - 导入数据（货品表/库存表）
- `db:export-products` - 导出产品视图
- `db:export-goods` - 导出货品表
- `db:export-inventory` - 导出库存表
- `db:export-bundles` - 导出货组
- `db:clear-goods` - 清空货品表
- `db:clear-inventory` - 清空库存表

### handlers/statsHandlers.js

统计信息相关的 IPC handlers：

- `db:get-stats` - 获取统计信息

### handlers/index.js

统一注册模块，负责：

- 导入所有 handler 注册函数
- 提供 `registerAllHandlers()` 统一注册接口

## 使用方式

### 添加新的 handler

1. 在对应的 handler 文件中添加新的 `ipcMain.handle()`
2. 或者创建新的 handler 文件（如 `userHandlers.js`）
3. 在 `handlers/index.js` 中导入并注册

示例：

```javascript
// handlers/newHandlers.js
const { ipcMain } = require("electron");
const { getDatabase } = require("../database");

function registerNewHandlers() {
  ipcMain.handle("db:new-operation", async (event, params) => {
    const db = getDatabase();
    // 实现逻辑
  });
}

module.exports = { registerNewHandlers };
```

```javascript
// handlers/index.js
const { registerNewHandlers } = require("./newHandlers");

function registerAllHandlers() {
  // ... 其他 handlers
  registerNewHandlers();
}
```

## 优势

1. **清晰的职责分离**：每个模块只负责特定功能
2. **易于维护**：代码按功能组织，容易找到和修改
3. **可扩展性好**：添加新功能只需新增文件或在对应文件中添加
4. **代码复用**：数据库实例通过 `getDatabase()` 统一获取
5. **减少主文件复杂度**：main.cjs 从 800+ 行降至 50+ 行

## 注意事项

- 所有 handlers 都使用 `getDatabase()` 获取数据库实例
- 确保在应用启动时调用 `initDatabase()` 初始化数据库
- IPC 返回的数据需要确保可序列化（使用 `JSON.parse(JSON.stringify())`）
- 错误处理应该在每个 handler 中妥善处理并返回统一格式
