/**
 * 达人管理 API
 */
import { get, post, put, del } from "./request";

// 商务负责人信息
export interface Liaison {
  id: number;
  username: string;
  realName: string;
}

// 达人类型定义
export interface Talent {
  id: number;
  nickname: string;
  type: string; // 短视频/直播/图文
  fansCount: number;
  pitFee: number;
  commissionRateOnline: number;
  commissionRateOffline: number;
  contactInfo?: string;
  liaisonId?: number;
  liaison?: Liaison;
  status: string; // 沟通中/已合作/已失效
  cumulativeGmv: number;
  createdAt?: string;
  updatedAt?: string;
}

// 达人列表查询参数
export interface TalentQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  status?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  data?: T[];
  list?: T[];
  total: number;
  page: number;
}

// 达人建议（用于搜索下拉）
export interface TalentSuggestion {
  id: number;
  nickname: string;
  type: string;
  fansCount: number;
}

/**
 * 获取达人列表
 */
export function getTalents(
  params?: TalentQueryParams,
): Promise<PaginatedResponse<Talent>> {
  return get("/talents", params);
}

/**
 * 获取达人搜索建议
 */
export function getTalentSuggestions(
  keyword: string,
): Promise<TalentSuggestion[]> {
  return get("/talents/suggestions", { keyword });
}

/**
 * 创建达人
 */
export function createTalent(
  data: Partial<Talent>,
): Promise<{ success: boolean; data: Talent }> {
  return post("/talents", data);
}

/**
 * 获取达人详情
 */
export function getTalentDetail(id: number): Promise<Talent> {
  return get(`/talents/${id}`);
}

/**
 * 更新达人
 */
export function updateTalent(
  id: number,
  data: Partial<Talent>,
): Promise<{ success: boolean }> {
  return put(`/talents/${id}`, data);
}

/**
 * 删除达人
 */
export function deleteTalent(id: number): Promise<{ success: boolean }> {
  return del(`/talents/${id}`);
}
