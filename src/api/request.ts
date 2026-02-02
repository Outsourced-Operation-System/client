/**
 * HTTP 请求基础模块
 */
import { getApiBaseUrl } from "../composables/useApiConfig";

// API 基础配置 - 动态获取
export const getBaseUrl = () => getApiBaseUrl();

// 兼容旧代码的导出（不推荐使用，请使用 getBaseUrl()）
// export const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// 通用请求方法
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Request failed: ${endpoint}`, error);
    throw error;
  }
}

// GET 请求
export function get<T>(
  endpoint: string,
  params?: Record<string, any>,
): Promise<T> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return request<T>(url, { method: "GET" });
}

// POST 请求
export function post<T>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PUT 请求
export function put<T>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// DELETE 请求
export function del<T>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "DELETE",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// 文件上传请求
export async function upload<T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>,
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
}
