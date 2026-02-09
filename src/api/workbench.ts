import { get } from "@/api/request";

export interface workbenchCount {
  talentCount: number;
  gmv: number;
  executionOrderCount: number;
  bundleCount: number;
}
export interface workbenchTrend {
  talentTrend: number;
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

export interface talentTypes {
  live: number;
  video: number;
  image: number;
}
export interface talentResp {
  data: talentTypes;
  error?: boolean;
  message?: string;
}

// 审计日志相关类型
export interface AuditLogUser {
  id: number;
  username: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: AuditLogUser;
  targetType: string;
  targetId: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
}

export interface AuditLogsParams {
  targetType?: string;
  targetID?: string;
  page?: number;
  pageSize?: number;
}

export const workbenchApi = {
  /**
   * 获取工作台统计数据
   */
  getWorkbenchStats: (): Promise<workbenchResp<workbenchStats>> => {
    return get("/workbench/stats");
  },
  getTalentTypes: (): Promise<talentResp> => {
    return get("/workbench/talent-types");
  },
  /**
   * 获取审计日志
   */
  getAuditLogs: (params: AuditLogsParams): Promise<AuditLogsResponse> => {
    return get("/logs", params);
  },
};
