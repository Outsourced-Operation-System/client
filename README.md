<div align="center">

# BundleGenerator

基于 **Electron + Vue 3 + TypeScript + Element Plus** 的桌面应用，用于导入货品/库存数据并快捷生成「货组（Bundle）」及管理。

[![Version](https://img.shields.io/badge/version-0.0.3-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F.svg)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5.24-42b883.svg)](https://vuejs.org/)

</div>

## 功能概览

- **数据维护**：

  - 支持导入/更新/覆盖 货品表（商品信息）与 库存表 数据（支持 `.xlsx` / `.xls` / `.csv`）。
  - 显示当前商品总数、最后更新时间。
  - 支持导出「全部商品数据」「货品表」「库存表」。
  - 支持一键清空货品数据 / 库存数据（带二次确认）。

- **货组生成（Bundle 生成）**：

  - 搜索商品：按名称、编码、TU 等关键词搜索，并可筛选「库存为 0」的数据。
  - 商品选择：在列表中勾选商品，并为每行设置「主品 / 赠品」类型。
  - 统计信息：实时展示主品数量、赠品数量、总货值。
  - 参数设置：填写货组名称、使用时间（开始/结束日期）。
  - 一键生成货组：生成成功后返回虚拟编码 `virtual_code` 并存入本地数据库。

- **货组管理**：
  - 列表查看已生成的货组（虚拟编码、名称、时间范围、总货值、状态等）。
  - 支持按时间区间、关键词检索。
  - 预留操作：编辑、复制、导出、删除等（删除已接入后端逻辑）。

**数据存储位置**：`app.getPath("userData")/bundle.db`

## 项目结构

````bash
.
├─ electron/                    # Electron 主进程代码
│  ├── main.cjs                 # 应用主入口（简化后 50+ 行）
│  ├── preload.js              # 预加载脚本，暴露安全 IPC 接口
│  ├── database/               # 数据库模块
│  │   └── index.cjs          # 数据库初始化和表结构管理
│  └── handlers/               # IPC 处理器模块（工程化设计）
│      ├── index.cjs          # 统一注册所有 handlers
│      ├── productHandlers.cjs # 产品查询相关操作
│      ├── bundleHandlers.cjs  # 货组管理相关操作
│      ├── dataHandlers.cjs    # 数据导入导出操作
│      └── statsHandlers.cjs   # 统计信息操作
│
├─ src/                         # Vue 前端代码
│  ├─ main.ts                  # Vue 应用入口
│  ├─ App.vue                  # 根组件
│  ├─ router/                  # 路由配置
│  │  └─ index.ts             # 路由定义（货组生成/管理/数据维护）
│  ├─ layout/                  # 布局组件
│  │  └─ MainLayout.vue       # 主布局（侧边导航）
│  ├─ views/                   # 页面组件
│  │  ├─ BundleGenerator.vue  # 货组生成页
│  │  ├─ BundleManager.vue    # 货组管理页
│  │  └─ DataMaintenance.vue  # 数据维护页
│  ├─ components/              # 业务组件
│  │  ├─ BundleGenerator/     # 货组生成相关组件
│  │  ├─ BundleManager/       # 货组管理相关组件
│  │  └─ DataMaintenance/     # 数据维护相关组件
│  ├─ composables/             # 组合式函数（业务逻辑）
│  │  ├─ BundleGenerator/     # 货组生成逻辑
│  │  ├─ BundleManager/       # 货组管理逻辑
│  │  └─ DataMaintenance/     # 数据维护逻辑
│  └─ utils/                   # 工具函数
│     └─ electronAPI.ts       # 预加载脚本暴露的 IPC
│
└─public/                      # 静态资源


### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- Windows 10/11（推荐）

### 安装依赖

```bash
npm install
````

### 开发模式

#### 1. 仅启动前端（调试 Vue 页面）

```bash
npm run dev
```

访问：`http://localhost:5173`

> 注：此模式下无法使用数据库功能（需要 Electron IPC）。

#### 2. 启动完整应用（推荐）

```bash
npm run electron:dev
```

**工作流程**：

1. 启动 Vite 开发服务器（端口 5173）
2. 等待端口可用
3. 启动 Electron 主进程并加载开发页面
4. 支持热更新（前端代码修改自动刷新）

### 生产构建

#### 构建前端资源

```bash
npm run build
```

输出目录：`dist/`

#### 打包桌面应用

```bash
npm run electron:build
```

输出目录：`release/`

- `Bundle Setup 0.0.3.exe` - Windows 安装程序
- `win-unpacked/` - 免安装版本

### 数据库结构

| 表名            | 说明             | 关键字段                           |
| --------------- | ---------------- | ---------------------------------- |
| `goods`         | 货品信息         | A 码、TU、品名、规格、价格、原产国 |
| `inventory`     | 库存信息         | SKU、批次、到期日、可用库存        |
| `products_view` | 产品视图（聚合） | TU/SKU 聚合，供搜索使用            |
| `bundles`       | 货组主表         | 虚拟编码、名称、使用时间、总货值   |
| `bundle_items`  | 货组明细         | 关联商品、数量、主品/赠品类型      |

### 数据操作

- **导入**：支持 `.xlsx` / `.xls` / `.csv` 格式
- **导出**：导出为 Excel 文件
- **备份**：建议定期备份 `bundle.db` 文件
- **IPC 通信**：所有数据库操作通过 Electron IPC 实现（见 `electron/handlers/`）

## 架构设计

### 工程化特点

1. **前后端分离**

   - 前端：Vue 3 组合式 API + TypeScript
   - 后端：Electron 主进程 + SQLite 数据库
   - 通信：IPC（Inter-Process Communication）

2. **模块化设计**

   - Electron handlers 按功能拆分（product/bundle/data/stats）
   - Vue composables 封装业务逻辑
   - 组件按页面分类组织

3. **代码精简**

   - 主进程代码从 800+ 行重构至 50+ 行
   - 职责清晰，易于维护和扩展

4. **类型安全**
   - 全面使用 TypeScript
   - 严格类型检查

## 数据存储

- 应用使用 `better-sqlite3` 原生 SQLite 数据库，数据自动持久化到 `bundle.db` 文件：
  - 表 `goods`：存储货品信息（A 码、TU、品名、规格、价格、原产国等）。
  - 表 `inventory`：存储库存信息（SKU、批次、到期日、可用库存等）。
  - 视图 `products_view`：将 `goods` 与 `inventory` 按 TU/SKU 聚合，供前端商品搜索使用。
  - 表 `bundles` / `bundle_items`：存储生成的货组及其包含的商品信息。
- 数据导入/导出及删除均通过 Electron IPC（在 `electron/main.cjs` 中实现）。

```

```
