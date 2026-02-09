import { get, post, put, del } from "./request";
import type { Talent } from "./talent";
import type { BundleRecord } from "./bundle";

// 执行单状态
export const ExecutionOrderStatus = {
  Communicating: "沟通中",
  Sampling: "寄样中",
  Scheduling: "排期中",
  Completed: "已完结",
};

// 合作类型
export const CoopType = {
  Live: "直播",
  ShortVideo: "短视频",
};

// 执行单内关联的货组
export interface ExecutionOrderBundle {
  id?: number;
  executionOrderId?: number;
  bundleId: number;
  bundle?: BundleRecord;
  sortOrder: number;
  mechanism: string;
}

// 执行单数据结构
export interface ExecutionOrder {
  id: number;
  code: string;
  name: string;
  type: string;
  date: string;
  pitFee: number;
  commissionRate: number;
  talentId: number;
  talent?: Talent;
  creatorId: number;
  creator?: any; // User type if available
  status: string;
  bundles?: ExecutionOrderBundle[];
  createdAt: string;
  updatedAt: string;
}

// 创建/更新请求参数
export interface ExecutionOrderReq {
  name: string;
  type: string;
  date: string;
  talentId: number;
  pitFee: number;
  commissionRate: number;
  status?: string;
  bundles: {
    bundleId: number;
    sortOrder: number;
    mechanism: string;
  }[];
}

export interface ExecutionOrderQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  talentId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
}

// 获取执行单列表
export const getExecutionOrders = (params: ExecutionOrderQueryParams) => {
  return get<PaginatedResponse<ExecutionOrder>>("/execution-orders", params);
};

// 获取执行单详情
export const getExecutionOrder = (id: number) => {
  return get<{ success: boolean; data: ExecutionOrder }>(
    `/execution-orders/${id}`,
  );
};

// 创建执行单
export const createExecutionOrder = (data: ExecutionOrderReq) => {
  return post<{ success: boolean; data: ExecutionOrder }>(
    "/execution-orders",
    data,
  );
};

// 更新执行单
export const updateExecutionOrder = (id: number, data: ExecutionOrderReq) => {
  return put<{ success: boolean }>(`/execution-orders/${id}`, data);
};

// 删除执行单
export const deleteExecutionOrder = (id: number) => {
  return del<{ success: boolean }>(`/execution-orders/${id}`);
};
