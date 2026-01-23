/**
 * 标签相关 API
 */
import { get, post, del } from "./request";

export interface Label {
  category: string;
  product_type: string;
  by_sku: string;
  fragrance: string;
}

export interface LabelValues {
  [field: string]: string[];
}

export const labelApi = {
  /**
   * 搜索标签
   */
  searchLabels: (field: string, keyword: string): Promise<string[]> => {
    return get("/labels/search", { field, keyword });
  },

  /**
   * 获取标签字段的所有值
   */
  getLabelValues: (field: string): Promise<string[]> => {
    return get(`/labels/values/${field}`);
  },

  /**
   * 获取所有标签
   */
  getAllLabels: (): Promise<LabelValues> => {
    return get("/labels");
  },

  /**
   * 删除标签
   */
  deleteLabel: (
    field: string,
    value: string,
  ): Promise<{ success: boolean; error?: string; affectedRows?: number }> => {
    return del("/labels", { field, value });
  },

  /**
   * 添加标签
   */
  addLabel: (
    field: string,
    value: string,
  ): Promise<{ success: boolean; error?: string; exists?: boolean }> => {
    return post("/labels", { field, value });
  },
};
