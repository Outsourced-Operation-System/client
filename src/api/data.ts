/**
 * 数据维护相关 API
 */
import { get, del, upload } from "./request";
import { getApiBaseUrl } from "@/composables/useApiConfig";

export interface DataStats {
  count: number;
  inventoryCount: number;
  productLastUpdate: string | null;
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
   * 导出产品数据 - 返回 Blob 数据
   */
  exportProducts: async (): Promise<Blob> => {
    const url = `${getApiBaseUrl()}/data/export/products`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }
    return response.blob();
  },

  /**
   * 导出库存数据 - 返回 Blob 数据
   */
  exportInventory: async (): Promise<Blob> => {
    const url = `${getApiBaseUrl()}/data/export/inventory`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }
    return response.blob();
  },

  /**
   * 导出标签数据 - 返回 Blob 数据
   */
  exportLabels: async (): Promise<Blob> => {
    const url = `${getApiBaseUrl()}/data/export/labels`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }
    return response.blob();
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
