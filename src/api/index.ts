/**
 * API 模块统一导出
 */

// 导出请求方法
export { request, get, post, put, del, upload } from "./request";

// 导出产品 API
export { productApi } from "./product";
export type {
  Product,
  SearchProductsParams,
  SearchProductsResponse,
  ProductSuggestion,
} from "./product";

// 导出货组 API
export { bundleApi } from "./bundle";
export type {
  BundleItem,
  BundleData,
  BundleRecord,
  BundleFilters,
  BundlesResponse,
  StockCheckItem,
  InsufficientItem,
  StockCheckResponse,
} from "./bundle";

// 导出数据维护 API
export { dataApi } from "./data";
export type { DataStats, ImportResponse } from "./data";

// 导出备份 API
export { backupApi } from "./backup";
export type { BackupInfo } from "./backup";

// 导出标签 API
export { labelApi } from "./label";
export type { Label, LabelValues } from "./label";

// 导出达人 API
export {
  getTalents,
  getTalentSuggestions,
  createTalent,
  getTalentDetail,
  updateTalent,
  deleteTalent,
} from "./talent";
export type {
  Talent,
  TalentQueryParams,
  TalentSuggestion,
  PaginatedResponse,
} from "./talent";

// 导出统计 API
export { getDataStats, checkHealth } from "./stats";
export type { HealthStatus } from "./stats";

// 统一 API 对象
import { productApi } from "./product";
import { bundleApi } from "./bundle";
import { dataApi } from "./data";
import { backupApi } from "./backup";
import { labelApi } from "./label";

export const api = {
  product: productApi,
  bundle: bundleApi,
  data: dataApi,
  backup: backupApi,
  label: labelApi,
};

export default api;
