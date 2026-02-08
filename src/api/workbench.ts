import { get } from "@/api/request";

export interface workbenchCount {
  tatlentCount: number;
  gmvTotal: number;
  executionOrderCount: number;
  bundleCount: number;
}
export interface workbenchTrend {
  tatlentTrend: number;
  gmvTrend: number;
  executionOrderTrend: number;
  bundleTrend: number;
}
export interface workbenchStats {
  count: workbenchCount;
  trend: workbenchTrend;
}

export interface workbenchResp<T> {
  data: T;
  countErr?: boolean;
  trendErr?: boolean;
  errors?: string[];
}

export const workbenchApi = {
  /**
   * 获取工作台统计数据
   */
  getWorkbenchStats: (): Promise<workbenchResp<workbenchStats>> => {
    return get("/workbench/stats");
  },
};
