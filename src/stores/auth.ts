/**
 * 用户认证状态管理
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface User {
  id: number;
  username: string;
  role: string;
  createdAt?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  expiresAt: number | null;
}

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);
  const expiresAt = ref<number | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  // 设置认证信息
  function setAuth(authData: { token: string; user: User; expiresAt: number }) {
    token.value = authData.token;
    user.value = authData.user;
    expiresAt.value = authData.expiresAt;
    localStorage.setItem("token", authData.token);
  }

  // 设置用户信息
  function setUser(userData: User) {
    user.value = userData;
  }

  // 清除认证信息
  function clearAuth() {
    token.value = null;
    user.value = null;
    expiresAt.value = null;
    localStorage.removeItem("token");
  }

  // 检查 token 是否过期
  function isTokenExpired(): boolean {
    if (!expiresAt.value) return true;
    return Date.now() > expiresAt.value * 1000;
  }

  return {
    token,
    user,
    expiresAt,
    isAuthenticated,
    isAdmin,
    setAuth,
    setUser,
    clearAuth,
    isTokenExpired,
  };
});
