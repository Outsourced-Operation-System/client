# Vue 前端架构说明

基于 **Vue 3 + TypeScript + Vite + Element Plus** 的前端应用，负责展示界面、编排业务流程，并通过 Electron 预加载脚本暴露的安全 IPC 与后端交互。

## 目录结构

```bash
src/
├── main.ts                 # Vue 应用入口
├── App.vue                 # 根组件
├── env.d.ts                # TypeScript 类型声明（全局）
├── style.css               # 全局基础样式
├── styles/                 # 主题与 Element Plus 定制样式
│   └── element-variables.css
├── router/                 # 路由配置
│   └── index.ts            # 路由定义（货组生成 / 管理 / 数据维护）
├── layout/                 # 布局组件
│   └── MainLayout.vue      # 主布局（侧边导航 + 顶部区域）
├── views/                  # 页面级组件
│   ├── BundleGenerator.vue # 货组生成页
│   ├── BundleProducts.vue  # 货组商品编辑页（从管理页进入）
│   ├── BundleManager.vue   # 货组管理页
│   └── DataMaintenance.vue # 数据维护页
├── components/             # 业务组件（页面拆分）
│   ├── BundleGenerator/    # 货组生成相关组件
│   ├── BundleManager/      # 货组管理相关组件
│   └── DataMaintenance/    # 数据维护相关组件
└── composables/            # 组合式函数（业务逻辑）
    ├── BundleGenerator/    # 货组生成逻辑封装
    ├── BundleManager/      # 货组管理逻辑封装
    └── DataMaintenance/    # 数据维护逻辑封装
```

## 核心模块

### 1️. main.ts - 应用入口

**职责：**

- 创建 Vue 应用实例并挂载到 DOM
- 注册路由、全局组件与插件（如 Element Plus）
- 注入全局样式（style.css / element-variables.css）
- 在开发/生产环境下加载对应资源

### 2️. router/index.ts - 路由配置

**职责：**

- 定义应用的主路由结构
- 映射 4 个核心业务页面：
  - `/#/generator`：货组生成
  - `/#/manager`：货组管理
  - `/#/bundle-products`：商品编辑
  - `/#/data`：数据管理
- 结合 `MainLayout` 实现「左侧导航 + 右侧内容区」布局

### 3️. layout/MainLayout.vue - 布局组件

**职责：**

- 提供全局一致的页面框架
- 包含：侧边菜单 / 顶部标题区域 / 内容渲染区域
- 与路由联动，高亮当前菜单项

### 4️. views/\* - 页面组件

#### 4.1 BundleGenerator.vue - 货组生成

**功能：**

- 搜索、筛选并选择商品
- 为每一行商品设置「主品 / 赠品」类型与数量
- 实时展示主品数、赠品数、总货值等统计信息
- 配置货组名称、使用时间（开始/结束日期）
- 通过 IPC 调用后端，生成货组并获取虚拟编码 `virtual_code`

**典型子组件：**（位于 `components/BundleGenerator/`）

- `SearchSection.vue`：搜索条件与过滤区域
- `BundleTable.vue`：商品列表展示与勾选
- `PreviewPanel.vue`：右侧预览与统计
- `SearchResultDialog.vue`：搜索结果弹窗/补充展示
- `ConfirmClearDialog.vue`：清空选择前的二次确认

#### 4.2 BundleProducts.vue - 货组商品编辑

**功能：**

- 从「货组管理」中点击某一行的「商品编辑」进入，路由形如：`/bundle-products?bundleId=xxx`。
- 通过 IPC 调用 `db:get-bundle-detail` 加载指定货组的基础信息与商品明细。
- 列表中展示每个商品的：主品/赠品类型、A 码、SKU 码、品名、当前库存、A 码聚合库存、效期剩余月数、货值、保质期、规格等。
- 当前库存来自 `goods` 表的实时数据，保证与「货组生成」页面看到的库存数量保持一致。
- 支持：
  - 修改主品/赠品类型；
  - 移除已在货组中的商品；
  - 分页浏览全部明细；
  - 通过搜索弹窗追加新商品并自动归类主品/赠品。
- 点击「保存修改」时：
  - 计算新增 SKU / 删除 SKU 集合；
  - 调用 `db:update-bundle-items` 更新 `bundle_items` 明细与 `bundles` 中的主品/赠品/总货值；
  - 根据新增/删除的 SKU 对 `inventory` 表做占用或归还库存；
  - 保存成功后自动返回上一页。
- 点击「返回」时：
  - 如检测到 `hasUnsavedChanges`（与初始明细对比）会弹出确认框，用户确认后丢弃未保存修改并返回；
  - 若无任何变更则直接返回。

#### 4.3 BundleManager.vue - 货组管理

**功能：**

- 列表展示已生成货组（虚拟编码、名称、时间区间、总货值、状态、用途、标签等）
- 支持按关键词、时间区间等条件过滤
- 支持单个删除、批量删除
- 支持批量导出（按 SKU / 虚拟组套两种格式）
- 支持在弹窗中编辑货组基础信息（名称、时间、用途、标签、状态）

**典型子组件：**（位于 `components/BundleManager/`）

- `FilterSection.vue`：筛选条件区域
- `BundleTable.vue`：货组列表与操作列
- `BatchOperations.vue`：批量操作入口（预留）

#### 4.4 DataMaintenance.vue - 数据维护

**功能：**

- 导入/更新/覆盖货品表、库存表与标签表（支持覆盖模式）
- 查看当前商品数量，以及货品 / 库存 / 标签的最后更新时间
- 导出货品表、库存表、标签表
- 一键清空货品或库存数据（带二次确认）
- 管理标签表（新增 / 删除标签项）
- 一键备份 / 恢复数据库，并查看、删除历史备份

**典型子组件：**（位于 `components/DataMaintenance/`）

- `DataStatusCard.vue`：当前数据概览
- `BackupCard.vue`：备份与恢复入口
- `BackupListDialog.vue`：备份历史列表
- `ConfirmDialog.vue`：通用二次确认弹窗

### 5️. composables/\* - 组合式函数

**职责：** 将可复用的业务逻辑从组件中抽离，统一管理：

- `BundleGenerator/`：
  - 搜索与分页逻辑
  - 选中商品列表的状态管理
  - 主品/赠品与数量计算
  - 统计信息（件数、总货值）计算
  - 调用 Electron IPC 创建货组
- `BundleManager/`：
  - 货组列表加载与分页
  - 条件筛选与重置
  - 删除等操作逻辑
- `DataMaintenance/`：
  - 文件选择与导入流程
  - 导出任务触发与状态反馈
  - 数据清空、备份和恢复逻辑

通过 composables，可以在多个组件间共享同一套业务逻辑，避免重复代码。

### 6️. styles/ 与全局样式

- `style.css`：基础全局样式与布局类
- `styles/element-variables.css`：Element Plus 主题变量定制

通过统一的样式管理，保证界面风格一致、易于调整主题。

## 与 Electron 后端的协作

前端不会直接访问数据库，而是通过 Electron 预加载脚本暴露的安全 API 与后端通信（典型模式如下）：

1. 组件或 composable 中调用封装好的 `electronAPI`/IPC 接口。
2. Electron 主进程在 `electron/handlers/*` 中处理具体数据库逻辑。
3. 前端仅关心输入参数与返回结果（数据或操作状态）。

这样可以：

- 保持前端纯 UI + 业务编排的职责
- 隔离数据库与文件系统访问，提升安全性
- 方便未来替换/扩展后端实现

## 架构优势

| 优势           | 说明                                               | 效果                 |
| -------------- | -------------------------------------------------- | -------------------- |
| **职责分离**   | views / components / composables 分层清晰          | 代码结构清晰、易维护 |
| **模块化组织** | 以业务域拆分目录（Bundle/Data 等）                 | 快速定位相关代码     |
| **可复用逻辑** | 通过 composables 复用业务逻辑                      | 减少重复、提升一致性 |
| **类型安全**   | 全面使用 TypeScript 与类型声明                     | 降低运行时错误       |
| **易于扩展**   | 新功能通过新增 view + components + composable 即可 | 不影响既有功能       |

## 设计原则

1. **单一职责原则（SRP）**
   - 组件专注于视图与交互，逻辑下沉至 composables
2. **组合优于继承**
   - 通过组合式 API 组织逻辑块，按需引入
3. **前后端分离**
   - 所有数据操作通过 IPC 完成，前端不直接操作数据库
4. **模块化封装**
   - 按业务域（BundleGenerator / BundleManager / DataMaintenance）划分代码

## 相关文档

- [项目总览](../README.md)
- [Electron 后端架构](../electron/README.md)
