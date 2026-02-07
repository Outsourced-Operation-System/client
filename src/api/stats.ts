/**
 * 统计数据 API
 */
import { get } from "./request";

// 数据统计响应
export interface DataStats {
  count: number;
  inventoryCount: number;
  bundleCount?: number;
  talentCount?: number;
  executionOrderCount?: number;
}

// 系统健康检查响应
export interface HealthStatus {
  status: string;
  db: string;
}

/**
 * 获取数据统计信息
 */
export function getDataStats(): Promise<DataStats> {
  return get("/data/stats");
}

/**
 * 系统健康检查
 */
export function checkHealth(): Promise<HealthStatus> {
  return get("/health");
}
