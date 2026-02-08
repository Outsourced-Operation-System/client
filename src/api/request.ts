/**
 * HTTP 请求基础模块
 * 包含 JWT Token 自动携带和 401 错误处理
 */
import { getApiBaseUrl } from "../composables/useApiConfig";
import router from "../router";
import { ElMessageBox } from "element-plus";

// API 基础配置 - 动态获取
export const getBaseUrl = () => getApiBaseUrl();

// 不需要携带 Token 的接口白名单
const AUTH_WHITE_LIST = ["/api/auth/login", "/api/auth/register"];

// 获取 Token
function getToken(): string | null {
  return localStorage.getItem("token");
}

// 清除认证信息并跳转登录页
async function handleUnauthorized() {
  // 显示弹窗提示
  await ElMessageBox.alert("登录已过期，请重新登录", "提示", {
    confirmButtonText: "确认",
    type: "warning",
  });

  localStorage.removeItem("token");

  // 如果在 Electron 环境，通知主进程
  if (window.electronAPI?.logout) {
    window.electronAPI.logout();
  } else {
    router.push("/login");
  }
}

// 检查是否需要携带 Token
function needsToken(endpoint: string): boolean {
  return !AUTH_WHITE_LIST.some((path) => endpoint.startsWith(path));
}

// 通用请求方法
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 如果需要 Token 且 Token 存在，则添加到 Header
  const token = getToken();
  if (needsToken(endpoint) && token) {
    (defaultHeaders as Record<string, string>)["Authorization"] =
      `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // 处理 401 未授权错误
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("未授权，请重新登录");
    }

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

  // 文件上传也需要携带 Token
  const headers: HeadersInit = {};
  const token = getToken();
  if (needsToken(endpoint) && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  // 处理 401 未授权错误
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("未授权，请重新登录");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
}
