/**
 * 开发者模式管理 composable
 * 用于控制开发者功能的显示和访问权限
 */
import { ref, readonly } from "vue";

// 存储键名
const STORAGE_KEY = "developer_mode_enabled";

// 响应式的开发者模式状态
const isDeveloperMode = ref<boolean>(loadDeveloperMode());

/**
 * 从 localStorage 加载开发者模式状态
 */
function loadDeveloperMode(): boolean {
  try {
    // 开发环境下默认开启
    if (import.meta.env.DEV) {
      return true;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  } catch {
    return import.meta.env.DEV;
  }
}

/**
 * 保存开发者模式状态
 */
function saveDeveloperMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (error) {
    console.error("Failed to save developer mode:", error);
  }
}

/**
 * 开发者模式 composable
 */
export function useDeveloperMode() {
  /**
   * 启用开发者模式
   */
  const enableDeveloperMode = () => {
    isDeveloperMode.value = true;
    saveDeveloperMode(true);
  };

  /**
   * 禁用开发者模式
   */
  const disableDeveloperMode = () => {
    isDeveloperMode.value = false;
    saveDeveloperMode(false);
  };

  /**
   * 切换开发者模式
   */
  const toggleDeveloperMode = () => {
    isDeveloperMode.value = !isDeveloperMode.value;
    saveDeveloperMode(isDeveloperMode.value);
  };

  /**
   * 检查是否有开发者权限
   * 后续可以在这里添加鉴权逻辑
   */
  const checkDeveloperAccess = async (): Promise<boolean> => {
    // TODO: 后续可以添加远程鉴权逻辑
    // 例如：检查 token、调用鉴权 API 等
    return isDeveloperMode.value;
  };

  return {
    isDeveloperMode: readonly(isDeveloperMode),
    enableDeveloperMode,
    disableDeveloperMode,
    toggleDeveloperMode,
    checkDeveloperAccess,
  };
}
