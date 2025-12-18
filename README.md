<div align="center">

# BundleGenerator

基于 **Electron + Vue 3 + TypeScript + Element Plus** 的桌面应用，用于导入货品/库存数据并快捷生成「货组（Bundle）」及管理。

</div>

## 功能

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

## 技术栈

- 桌面端：Electron
- 前端框架：Vue 3 + TypeScript + Vite
- UI 组件库：Element Plus + @element-plus/icons-vue
- 路由：Vue Router
- 数据持久化：better-sqlite3（原生 SQLite），数据库文件保存在 `app.getPath("userData")/bundle.db`
- 表格/文件处理：xlsx

## 主要目录结构

```bash
.
├─ electron/            # Electron 主进程 & preload 脚本
│  ├─ main.cjs          # Electron 入口、SQLite 初始化及业务 IPC 处理
│  └─ preload.js        # 向渲染进程暴露 electronAPI
├─ src/
│  ├─ main.ts           # Vue 应用入口，挂载 Element Plus & 路由
│  ├─ App.vue           # 根组件，承载 <router-view />
│  ├─ router/
│  │  └─ index.ts       # 路由配置：货组生成 / 管理 / 数据维护
│  ├─ layout/
│  │  └─ MainLayout.vue # 主布局（侧边导航、顶部区域等）
│  └─ views/
│     ├─ BundleGenerator.vue   # 货组生成页
│     ├─ BundleManager.vue     # 货组管理页
│     └─ DataMaintenance.vue   # 数据维护页（导入/导出/清理）
├─ public/
│  └─ favicon.ico       # 应用图标
├─ 货品表.csv            # 示例商品数据
├─ 库存表.csv            # 示例库存数据
└─ vite.config.ts       # Vite 配置
```

## 开发与运行

> 下面命令均在项目根目录执行。

### 1. 安装依赖

```bash
npm install
```

### 2. 仅启动前端（调试 Vue 页面）

```bash
npm run dev
```

访问：`http://localhost:5173`。

### 3. 启动 Electron + 前端联调

```bash
npm run electron:dev
```

脚本说明：

- 先启动 Vite 开发服务器（端口 5173）。
- 待端口可用后启动 Electron 主进程，加载本地开发页面。

### 4. 生产构建 & 打包安装包

```bash
# 构建前端静态资源
npm run build

# 构建并打包 Electron 应用（封装安装包）
npm run electron:build
```

## 数据存储

- 应用使用 `better-sqlite3` 原生 SQLite 数据库，数据自动持久化到 `bundle.db` 文件：
  - 表 `goods`：存储货品信息（A 码、TU、品名、规格、价格、原产国等）。
  - 表 `inventory`：存储库存信息（SKU、批次、到期日、可用库存等）。
  - 视图 `products_view`：将 `goods` 与 `inventory` 按 TU/SKU 聚合，供前端商品搜索使用。
  - 表 `bundles` / `bundle_items`：存储生成的货组及其包含的商品信息。
- 数据导入/导出及删除均通过 Electron IPC（在 `electron/main.cjs` 中实现）。
