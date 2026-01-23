/**
 * 货组相关 API
 */
import { get, post, put, del } from "./request";

export interface BundleItem {
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

export interface BundleData {
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

export interface BundleRecord {
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

export interface BundleFilters {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface BundlesResponse {
  list: BundleRecord[];
  total: number;
}

export interface StockCheckItem {
  sku: string;
  article_code?: string;
  product_name_cn?: string;
  requiredQty?: number;
}

export interface InsufficientItem {
  sku: string;
  article_code: string;
  product_name_cn: string;
  qty_available: number;
  required_qty?: number;
}

export interface StockCheckResponse {
  success: boolean;
  sufficient: boolean;
  insufficientItems: InsufficientItem[];
}

export const bundleApi = {
  /**
   * 获取今日货组数量
   */
  getTodayBundleCount: (): Promise<{ count: number }> => {
    return get("/bundles/today-count");
  },

  /**
   * 检查货组名称是否存在
   */
  checkBundleNameExists: (
    name: string,
  ): Promise<{ success: boolean; exists: boolean }> => {
    return get("/bundles/check-name", { name });
  },

  /**
   * 检查商品库存是否充足
   */
  checkStockAvailability: (
    items: StockCheckItem[],
  ): Promise<StockCheckResponse> => {
    return post("/bundles/check-stock", { items });
  },

  /**
   * 检查商品库存是否充足（支持指定数量）
   */
  checkStockAvailabilityWithQty: (
    items: StockCheckItem[],
  ): Promise<StockCheckResponse> => {
    return post("/bundles/check-stock-with-qty", { items });
  },

  /**
   * 创建货组
   */
  createBundle: (
    bundleData: BundleData,
  ): Promise<{
    success: boolean;
    id?: number;
    message?: string;
    error?: string;
  }> => {
    return post("/bundles", bundleData);
  },

  /**
   * 获取货组列表
   */
  getBundles: (filters: BundleFilters): Promise<BundlesResponse> => {
    return get("/bundles", filters);
  },

  /**
   * 获取子货组
   */
  getChildBundles: (parentId: number): Promise<BundleRecord[]> => {
    return get(`/bundles/${parentId}/children`);
  },

  /**
   * 获取货组详情
   */
  getBundleDetail: (id: number): Promise<BundleRecord> => {
    return get(`/bundles/${id}`);
  },

  /**
   * 删除货组
   */
  deleteBundle: (
    id: number,
  ): Promise<{ success: boolean; message?: string }> => {
    return del(`/bundles/${id}`);
  },

  /**
   * 批量删除货组
   */
  batchDeleteBundles: (
    ids: number[],
  ): Promise<{ success: boolean; message?: string }> => {
    return post("/bundles/batch-delete", { ids });
  },

  /**
   * 批量导出货组
   */
  batchExportBundles: (
    ids: number[],
    exportType: "sku" | "virtual",
  ): Promise<{ success: boolean; filePath?: string }> => {
    return post("/bundles/batch-export", { ids, exportType });
  },

  /**
   * 更新货组状态
   */
  updateBundleStatus: (
    id: number,
    status: string,
  ): Promise<{ success: boolean }> => {
    return put(`/bundles/${id}/status`, { status });
  },

  /**
   * 更新货组
   */
  updateBundle: (
    bundleData: Partial<BundleRecord>,
  ): Promise<{ success: boolean }> => {
    return put(`/bundles/${bundleData.id}`, bundleData);
  },

  /**
   * 更新货组商品
   */
  updateBundleItems: (data: {
    bundleId: number;
    items: BundleItem[];
  }): Promise<{ success: boolean }> => {
    return put(`/bundles/${data.bundleId}/items`, { items: data.items });
  },
};
