# 后端接口文档

本文档描述了后端服务提供的所有 API 接口，包括请求方法、路径、参数及返回数据结构。

## 基础说明

- **基础 URL**: `/api` (开发环境: `http://localhost:3000/api`)
- **请求头**: 默认包含 `Content-Type: application/json`

---

## 1. 产品相关 API (`/products`)

### 1.1 搜索产品 (分页)

- **描述**: 根据条件搜索产品列表。
- **方法**: `GET`
- **路径**: `/products/search`
- **请求参数 (Query)**:
  - `query` (可选, string): 搜索关键词
  - `page` (可选, number): 页码
  - `pageSize` (可选, number): 每页数量
  - `sortProp` (可选, string): 排序字段
  - `sortOrder` (可选, string): 排序顺序
  - `filterZeroStock` (可选, boolean): 是否过滤零库存
- **返回**:
  ```ts
  {
    list: Product[]; // 产品列表
    total: number;   // 总数
  }
  ```

### 1.2搜索产品建议 (自动补全)

- **描述**: 用于搜索框的自动提示。
- **方法**: `GET`
- **路径**: `/products/suggestions`
- **请求参数 (Query)**:
  - `query` (必需, string): 搜索关键词
- **返回**: `ProductSuggestion[]`
  ```ts
  interface ProductSuggestion {
    value: string;
    product_name_cn: string;
    article_code: string;
    tu: string;
  }
  ```

### 1.3 根据搜索类型搜索产品

- **描述**: 更加复杂的搜索，支持指定搜索类型（如按SKU、产品名等）。
- **方法**: `POST`
- **路径**: `/products/search-by-types`
- **请求参数 (Body)**:
  ```json
  {
    "query": "string",
    "searchTypes": ["string"], // e.g. ["sku", "product_name_cn"]
    "filterZeroStock": boolean
  }
  ```
- **返回**: `Product[]` (产品列表)

### 1.4 获取 A码 库存总数

- **描述**: 获取指定 Article Code 的总库存。
- **方法**: `GET`
- **路径**: `/products/article-stock/:articleCode`
- **返回**:
  ```json
  {
    "total": number
  }
  ```

### 1.5 获取单个 SKU 库存

- **描述**: 获取指定 SKU 的库存。
- **方法**: `GET`
- **路径**: `/products/sku-stock/:sku`
- **返回**:
  ```json
  {
    "stock": number
  }
  ```

### 1.6 批量获取 SKU 库存

- **描述**: 批量查询多个 SKU 的库存。
- **方法**: `POST`
- **路径**: `/products/batch-sku-stock`
- **请求参数 (Body)**:
  ```json
  {
    "skus": ["string", "string"]
  }
  ```
- **返回**:
  ```ts
  Record<string, number>; // { "sku1": 100, "sku2": 50 }
  ```

---

## 2. 货组相关 API (`/bundles`)

### 2.1 获取今日货组数量

- **描述**: 获取当天创建的货组数量。
- **方法**: `GET`
- **路径**: `/bundles/today-count`
- **返回**:
  ```json
  {
    "count": number
  }
  ```

### 2.2 检查货组名称是否存在

- **描述**: 检查指定的货组名称是否已存在。
- **方法**: `GET`
- **路径**: `/bundles/check-name`
- **请求参数 (Query)**:
  - `name` (必需, string): 货组名称
- **返回**:
  ```json
  {
    "success": boolean,
    "exists": boolean
  }
  ```

### 2.3 检查商品库存是否充足

- **描述**: 检查一组商品的库存是否满足要求。
- **方法**: `POST`
- **路径**: `/bundles/check-stock`
- **请求参数 (Body)**:
  ```ts
  {
    items: {
      sku: string;
      article_code?: string;
      product_name_cn?: string;
      requiredQty?: number;
    }[]
  }
  ```
- **返回**:
  ```ts
  {
    success: boolean;
    sufficient: boolean;
    insufficientItems: {
      sku: string;
      article_code: string;
      product_name_cn: string;
      qty_available: number;
    }
    [];
  }
  ```

### 2.4 检查商品库存是否充足 (支持自定义数量)

- **描述**: 类似于 check-stock，但更明确地处理自定义数量。
- **方法**: `POST`
- **路径**: `/bundles/check-stock-with-qty`
- **请求参数**: 同上
- **返回**: 同上

### 2.5 创建货组

- **描述**: 创建一个新的货组。
- **方法**: `POST`
- **路径**: `/bundles`
- **请求参数 (Body)**:
  ```ts
  interface BundleData {
    name: string;
    virtualCode: string;
    endDate: string;
    items: BundleItem[];
    totalValue: number;
    mainValue: number;
    giftValue: number;
    category: string;
    productType: string;
    bySku: string;
    fragrance: string;
    usageType: string;
  }
  ```
- **返回**:
  ```json
  {
    "success": boolean,
    "id": number, // 新创建的ID
    "message": "string",
    "error": "string"
  }
  ```

### 2.6 获取货组列表

- **描述**: 搜索和筛选货组列表。
- **方法**: `GET`
- **路径**: `/bundles`
- **请求参数 (Query)**:
  - `keyword`: 搜索关键字
  - `status`: 状态
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `page`: 页码
  - `pageSize`: 每页大小
- **返回**:
  ```ts
  {
    list: BundleRecord[];
    total: number;
  }
  ```

### 2.7 获取子货组

- **描述**: 获取父货组下的所有子货组。
- **方法**: `GET`
- **路径**: `/bundles/:parentId/children`
- **返回**: `BundleRecord[]`

### 2.8 获取货组详情

- **描述**: 根据 ID 获取货组详情。
- **方法**: `GET`
- **路径**: `/bundles/:id`
- **返回**: `BundleRecord`

### 2.9 删除货组

- **描述**: 删除指定 ID 的货组。
- **方法**: `DELETE`
- **路径**: `/bundles/:id`
- **返回**:
  ```json
  {
    "success": boolean,
    "message": "string"
  }
  ```

### 2.10 批量删除货组

- **描述**: 批量删除多个货组。
- **方法**: `POST`
- **路径**: `/bundles/batch-delete`
- **请求参数 (Body)**:
  ```json
  {
    "ids": [number, number]
  }
  ```
- **返回**:
  ```json
  {
    "success": boolean,
    "message": "string"
  }
  ```

### 2.11 批量导出货组

- **描述**: 导出选中的货组数据。
- **方法**: `POST`
- **路径**: `/bundles/batch-export`
- **请求参数 (Body)**:
  ```ts
  {
    ids: number[];
    exportType: "sku" | "virtual";
  }
  ```
- **返回**:
  ```json
  {
    "success": boolean,
    "filePath": "string" // 下载链接或文件路径
  }
  ```

### 2.12 更新货组状态

- **描述**: 更新货组的状态（例如与删除、归档等操作相关）。
- **方法**: `PUT`
- **路径**: `/bundles/:id/status`
- **请求参数 (Body)**:
  ```json
  {
    "status": "string"
  }
  ```
- **返回**: `{ success: boolean }`

### 2.13 更新货组信息

- **描述**: 更新货组的基本信息。
- **方法**: `PUT`
- **路径**: `/bundles/:id`
- **请求参数 (Body)**: `Partial<BundleRecord>`
- **返回**: `{ success: boolean }`

### 2.14 更新货组商品

- **描述**: 更新指定货组内的商品列表。
- **方法**: `PUT`
- **路径**: `/bundles/:bundleId/items`
- **请求参数 (Body)**:
  ```ts
  {
    items: BundleItem[]
  }
  ```
- **返回**: `{ success: boolean }`

---

## 3. 数据维护 API (`/data`)

### 3.1 导入数据

- **描述**: 上传文件导入数据。
- **方法**: `POST` (Multipart)
- **路径**: `/data/import`
- **请求参数 (FormData)**:
  - `file`: (Binary) 文件
  - `type`: 数据类型
  - `mode`: 导入模式 (追加/覆盖等)
- **返回**:
  ```ts
  {
    success: boolean;
    message?: string;
    error?: string;
    count?: number; // 导入记录数
    productCount?: number;
    inventoryCount?: number;
    labelCount?: number;
  }
  ```

### 3.2 获取统计信息

- **描述**: 获取数据库的统计信息（记录数、最后更新时间等）。
- **方法**: `GET`
- **路径**: `/data/stats`
- **返回**:
  ```ts
  interface DataStats {
    count: number;
    productLastUpdate: string | null;
    inventoryLastUpdate: string | null;
    labelLastUpdate: string | null;
  }
  ```

### 3.3 导出产品数据

- **描述**: 导出当前产品表数据。
- **方法**: `POST`
- **路径**: `/data/export/products`
- **返回**:
  ```ts
  {
    success: boolean;
    filePath?: string;
    count?: number;
    error?: string;
  }
  ```

### 3.4 导出库存数据

- **描述**: 导出当前库存表数据。
- **方法**: `POST`
- **路径**: `/data/export/inventory`
- **返回**: 同上

### 3.5 导出标签数据

- **描述**: 导出当前标签表数据。
- **方法**: `POST`
- **路径**: `/data/export/labels`
- **返回**: 同上

### 3.6 清空产品数据

- **描述**: 删除所有产品数据。
- **方法**: `DELETE`
- **路径**: `/data/products`
- **返回**: `{ success: boolean }`

### 3.7 清空库存数据

- **描述**: 删除所有库存数据。
- **方法**: `DELETE`
- **路径**: `/data/inventory`
- **返回**: `{ success: boolean }`

---

## 4. 标签相关 API (`/labels`)

### 4.1 搜索标签

- **描述**: 在指定字段中搜索标签值。
- **方法**: `GET`
- **路径**: `/labels/search`
- **请求参数 (Query)**:
  - `field`: 字段名
  - `keyword`: 搜索词
- **返回**: `string[]` (匹配的值列表)

### 4.2 获取标签字段的所有值

- **描述**: 获取某个标签字段（例如 Fragrance）下的所有可能值。
- **方法**: `GET`
- **路径**: `/labels/values/:field`
- **返回**: `string[]`

### 4.3 获取所有标签

- **描述**: 获取所有字段及其对应的所有值。
- **方法**: `GET`
- **路径**: `/labels`
- **返回**:
  ```ts
  Record<string, string[]>; // { "category": ["A", "B"], ... }
  ```

### 4.4 删除标签

- **描述**: 删除特定字段下的某个值。
- **方法**: `DELETE`
- **路径**: `/labels`
- **请求参数 (Body)**:
  ```json
  {
    "field": "string",
    "value": "string"
  }
  ```
- **返回**:
  ```json
  {
    "success": boolean,
    "error": "string",
    "affectedRows": number
  }
  ```

### 4.5 添加标签

- **描述**: 向特定字段添加一个新值。
- **方法**: `POST`
- **路径**: `/labels`
- **请求参数 (Body)**:
  ```json
  {
    "field": "string",
    "value": "string"
  }
  ```
- **返回**:
  ```json
  {
    "success": boolean,
    "error": "string",
    "exists": boolean
  }
  ```

---

## 5. 备份相关 API (`/backup`)

### 5.1 备份数据库

- **描述**: 触发一次数据库备份。
- **方法**: `POST`
- **路径**: `/backup`
- **返回**:
  ```json
  {
    "success": boolean,
    "timestamp": "string"
  }
  ```

### 5.2 获取备份列表

- **描述**: 获取所有历史备份文件信息。
- **方法**: `GET`
- **路径**: `/backup`
- **返回**:
  ```ts
  interface BackupInfo {
    timestamp: string;
    filename: string;
    size: number;
    createdAt: string;
  }
  [];
  ```

### 5.3 恢复备份

- **描述**: 将数据库恢复到指定的备份时间点。
- **方法**: `POST`
- **路径**: `/backup/restore/:timestamp`
- **返回**: `{ success: boolean }`

### 5.4 删除备份

- **描述**: 删除指定的备份文件。
- **方法**: `DELETE`
- **路径**: `/backup/:timestamp`
- **返回**: `{ success: boolean }`

### 5.5 获取最后备份时间

- **描述**: 获取最近一次成功备份的时间。
- **方法**: `GET`
- **路径**: `/backup/last-time`
- **返回**:
  ```json
  {
    "lastBackupTime": "string | null"
  }
  ```

---

## 通用数据结构类型参考

### BundleItem

```ts
interface BundleItem {
  sku: string;
  article_code: string;
  tu: string;
  product_name_cn: string;
  product_name_en: string;
  cn_current_price: number;
  qty_available: number;
  remaining_months: string;
  declared_content: string;
  type: "main" | "gift";
  quantity: number;
}
```

### BundleRecord

```ts
interface BundleRecord {
  id: number;
  virtual_code: string;
  name: string;
  created_at: string;
  end_date: string;
  usage_type: string;
  total_value: number;
  main_value: number;
  gift_value: number;
  category: string;
  product_type: string;
  by_sku: string;
  fragrance: string;
  status: string;
  items?: BundleItem[];
}
```

### Product

```ts
interface Product {
  sku: string;
  article_code: string;
  tu: string;
  product_name_cn: string;
  product_name_en: string;
  declared_content: string;
  cn_current_price: number;
  qty_available: number;
  category: string;
  shelf_life: string;
  remaining_months: string;
  net_weight: string;
  item_size: string;
  country_of_origin: string;
}
```
