README由AI总结生成，供参考。

# Bundle Generator

一个基于 Electron + Vue 3 + TypeScript 的桌面应用程序，用于代运营系统的货组生成与管理。

## 项目概述

Bundle Generator 是一个专业的代运营系统工具，提供货组生成、货组管理、数据维护等核心功能，帮助用户高效管理商品货组和相关数据。

## 技术栈

- **前端框架**: Vue 3.5 + TypeScript
- **UI 组件库**: Element Plus 2.12
- **状态管理**: Pinia 3.0
- **路由管理**: Vue Router 4.6
- **构建工具**: Vite 7.2
- **桌面框架**: Electron 39.2
- **数据存储**: Better-SQLite3 12.5
- **表格处理**: ExcelJS 4.4
- **自动更新**: Electron Updater 6.7
- **日志管理**: Electron Log 5.4

## 主要功能

### 1. 货组生成器 (Bundle Generator)

- 智能货组组合生成
- 支持多种货组配置
- 批量生成货组方案

### 2. 货组管理器 (Bundle Manager)

- 货组列表管理
- 货组编辑与维护
- 货组状态跟踪

### 3. 数据维护 (Data Maintenance)

- 基础数据管理
- 商品信息维护
- 标签分类管理

### 4. 用户管理 (User Management)

- 用户权限控制
- 登录认证系统
- 密码修改功能

### 5. 开发者设置 (Developer Settings)

- API 配置管理
- 开发者模式
- 系统参数设置

### 6. 数据备份

- 本地数据备份
- 数据导入导出
- Excel 文件处理

## 项目结构

```
bundle/
├── electron/                 # Electron 主进程
│   ├── main.cjs             # 主进程入口
│   └── preload.js           # 预加载脚本
├── src/                     # 源代码目录
│   ├── api/                 # API 接口
│   ├── assets/              # 静态资源
│   ├── components/          # Vue 组件
│   ├── composables/         # 组合式函数
│   ├── layout/              # 布局组件
│   ├── router/              # 路由配置
│   ├── stores/              # 状态管理
│   ├── styles/              # 样式文件
│   ├── types/               # TypeScript 类型定义
│   ├── views/               # 页面视图
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── public/                  # 公共资源
├── build/                   # 构建配置
├── release/                 # 发布输出
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
└── tsconfig.json            # TypeScript 配置
```

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Python 3.x (用于编译 native 模块)
- Visual Studio Build Tools (Windows 环境)

## 安装依赖

```bash
npm install
```

## 开发调试

### 启动 Web 开发服务器

```bash
npm run dev
```

### 启动 Electron 开发环境

```bash
npm run electron:dev
```

该命令会同时启动 Vite 开发服务器和 Electron 应用，支持热重载。

## 构建打包

### 构建前端资源

```bash
npm run build
```

### 打包 Electron 应用

```bash
npm run electron:build
```

打包完成后，安装程序将输出到 `release/` 目录。

## 发布配置

应用程序配置了自动更新功能，通过 GitHub Releases 分发更新：

- **App ID**: com.xinda.BundleGenerator
- **产品名称**: Bundle
- **更新源**: GitHub Repository (Outsourced-Operation-System/client)
- **支持平台**: Windows x64

## API 配置

项目支持配置外部 API 地址，可在开发者设置中进行配置：

- 认证接口
- 货组管理接口
- 商品数据接口
- 标签管理接口
- 备份恢复接口

## 数据存储

应用使用 Better-SQLite3 进行本地数据存储，支持：

- 离线数据访问
- 快速查询性能
- 数据持久化
- 事务支持

## 开发规范

### TypeScript

- 启用严格类型检查
- 使用接口定义数据结构
- 避免使用 `any` 类型

### Vue 组件

- 使用 Composition API
- 组件按功能模块组织
- 统一使用 TypeScript

### 代码风格

- 遵循 ESLint 规则
- 使用 2 空格缩进
- 使用单引号

## 常见问题

### 1. native 模块编译失败

```bash
npm run electron:rebuild
```

### 2. 端口冲突

修改 `vite.config.ts` 中的端口配置。

### 3. Electron 白屏

检查开发者工具控制台错误信息，确认 API 配置是否正确。
