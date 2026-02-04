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

/**
 * 用户信息接口
 */
export interface UserInfo {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  username: string;
  role: string;
}

/**
 * 创建用户请求参数
 */
export interface CreateUserRequest {
  username: string;
  password?: string;
  role?: string;
}

/**
 * 更新用户请求参数
 */
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
}

/**
 * 获取所有用户 (仅管理员)
 */
export async function getUsers(): Promise<UserInfo[]> {
  const url = `${getApiBaseUrl()}/users`;
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
    throw new Error(error.message || `获取用户列表失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 创建新用户 (仅管理员)
 */
export async function createUser(data: CreateUserRequest): Promise<UserInfo> {
  const url = `${getApiBaseUrl()}/users`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `创建用户失败: ${response.status}`);
  }

  return (await response.json()).user;
}

/**
 * 更新用户信息 (仅管理员)
 */
export async function updateUser(
  id: number,
  data: UpdateUserRequest,
): Promise<void> {
  const url = `${getApiBaseUrl()}/users/${id}`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `更新用户失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 删除用户 (仅管理员)
 */
export async function deleteUser(id: number): Promise<void> {
  const url = `${getApiBaseUrl()}/users/${id}`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `删除用户失败: ${response.status}`);
  }

  return response.json();
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 修改密码
 */
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  const url = `${getApiBaseUrl()}/auth/change-password`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `修改密码失败: ${response.status}`);
  }

  return response.json();
}
