/**
 * 认证相关 API
 */
import { getApiBaseUrl } from "../composables/useApiConfig";
import type { User } from "../stores/auth";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

/**
 * 用户登录
 * 注意：登录接口不需要携带 token
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const url = `${getApiBaseUrl()}/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `登录失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 用户注册
 * 注意：注册接口不需要携带 token
 */
export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const url = `${getApiBaseUrl()}/auth/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `注册失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 获取当前用户信息
 * 用于验证 token 是否有效
 */
export async function getCurrentUser(): Promise<User> {
  const url = `${getApiBaseUrl()}/auth/me`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `获取用户信息失败: ${response.status}`);
  }

  return response.json();
}
