/**
 * 数据维护相关 API
 */
import { get, post, del, upload } from "./request";

export interface DataStats {
  count: number;
  inventoryCount: number;
  goodsLastUpdate: string | null;
  inventoryLastUpdate: string | null;
  labelLastUpdate: string | null;
}

export interface ImportResponse {
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
  productCount?: number;
  inventoryCount?: number;
  labelCount?: number;
}

export const dataApi = {
  /**
   * 导入数据
   */
  importData: (
    type: string,
    file: File,
    mode: string,
  ): Promise<ImportResponse> => {
    return upload("/data/import", file, { type, mode });
  },

  /**
   * 获取统计信息
   */
  getStats: (): Promise<DataStats> => {
    return get("/data/stats");
  },

  /**
   * 导出产品数据
   */
  exportProducts: (): Promise<{
    success: boolean;
    filePath?: string;
    count?: number;
    error?: string;
  }> => {
    return post("/data/export/products");
  },

  /**
   * 导出库存数据
   */
  exportInventory: (): Promise<{
    success: boolean;
    filePath?: string;
    count?: number;
    error?: string;
  }> => {
    return post("/data/export/inventory");
  },

  /**
   * 导出标签数据
   */
  exportLabels: (): Promise<{
    success: boolean;
    filePath?: string;
    count?: number;
    error?: string;
  }> => {
    return post("/data/export/labels");
  },

  /**
   * 清空产品数据
   */
  clearProducts: (): Promise<{ success: boolean }> => {
    return del("/data/products");
  },

  /**
   * 清空库存数据
   */
  clearInventory: (): Promise<{ success: boolean }> => {
    return del("/data/inventory");
  },
};
