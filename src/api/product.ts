/**
 * 产品相关 API
 */
import { get, post } from "./request";

export interface Product {
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

export interface SearchProductsParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortProp?: string;
  sortOrder?: string;
  filterZeroStock?: boolean;
}

export interface SearchProductsResponse {
  list: Product[];
  total: number;
}

export interface ProductSuggestion {
  value: string;
  product_name_cn: string;
  article_code: string;
  tu: string;
}

export const productApi = {
  /**
   * 搜索产品（分页）
   */
  searchProducts: (
    params: SearchProductsParams,
  ): Promise<SearchProductsResponse> => {
    return get("/products/search", params);
  },

  /**
   * 搜索产品建议（自动补全）
   */
  searchProductSuggestions: (query: string): Promise<ProductSuggestion[]> => {
    return get("/products/suggestions", { query });
  },

  /**
   * 根据搜索类型搜索产品
   */
  searchProductsByTypes: (
    query: string,
    searchTypes: string[],
    filterZeroStock: boolean,
  ): Promise<Product[]> => {
    return post("/products/search-by-types", {
      query,
      searchTypes,
      filterZeroStock,
    });
  },

  /**
   * 获取 A码 库存总数
   */
  getArticleStockTotal: (articleCode: string): Promise<{ total: number }> => {
    return get(`/products/article-stock/${encodeURIComponent(articleCode)}`);
  },

  /**
   * 获取单个 SKU 库存
   */
  getSkuStock: (sku: string): Promise<{ stock: number }> => {
    return get(`/products/sku-stock/${encodeURIComponent(sku)}`);
  },

  /**
   * 批量获取 SKU 库存
   */
  getBatchSkuStock: (skus: string[]): Promise<Record<string, number>> => {
    return post("/products/batch-sku-stock", { skus });
  },
};
