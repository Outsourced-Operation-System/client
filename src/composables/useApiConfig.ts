/**
 * API 配置管理 composable
 * 支持动态配置后端 API 地址
 */
import { ref, readonly } from "vue";

// 存储键名
const STORAGE_KEY = "api_base_url";

// 默认 API 地址
const DEFAULT_API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// 响应式的 API 基础地址
const apiBaseUrl = ref<string>(loadApiBaseUrl());

/**
 * 从 localStorage 加载 API 地址
 */
function loadApiBaseUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

/**
 * 保存 API 地址到 localStorage
 */
function saveApiBaseUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch (error) {
    console.error("Failed to save API URL:", error);
  }
}

/**
 * API 配置 composable
 */
export function useApiConfig() {
  /**
   * 获取当前 API 基础地址
   */
  const getApiBaseUrl = () => apiBaseUrl.value;

  /**
   * 设置新的 API 基础地址
   */
  const setApiBaseUrl = (url: string) => {
    // 确保 URL 格式正确（移除末尾的斜杠）
    const normalizedUrl = url.replace(/\/+$/, "");
    apiBaseUrl.value = normalizedUrl;
    saveApiBaseUrl(normalizedUrl);
  };

  /**
   * 重置为默认 API 地址
   */
  const resetApiBaseUrl = () => {
    apiBaseUrl.value = DEFAULT_API_URL;
    saveApiBaseUrl(DEFAULT_API_URL);
  };

  /**
   * 测试 API 连接
   */
  const testConnection = async (
    url?: string,
  ): Promise<{ success: boolean; message: string }> => {
    const testUrl = url || apiBaseUrl.value;
    try {
      const response = await fetch(`${testUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      //   console.log(response);
      if (response.ok) {
        return { success: true, message: "连接成功" };
      }
      return { success: false, message: `服务器响应错误: ${response.status}` };
    } catch (error: any) {
      if (error.name === "TimeoutError") {
        return { success: false, message: "连接超时" };
      }
      return { success: false, message: `连接失败: ${error.message}` };
    }
  };

  return {
    apiBaseUrl: readonly(apiBaseUrl),
    getApiBaseUrl,
    setApiBaseUrl,
    resetApiBaseUrl,
    testConnection,
    DEFAULT_API_URL,
  };
}

/**
 * 获取当前 API 基础地址（供 request.ts 使用）
 */
export function getApiBaseUrl(): string {
  return apiBaseUrl.value;
}
