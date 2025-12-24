import { watch } from "vue";

// 持久化存储的 key
const STORAGE_KEY = "bundle_generator_draft";

export interface DraftData {
  bundleItems: any[];
  bundleName: string;
  endDate: string;
  createTime: string;
  virtualCode: string;
  selectedCategory: string;
  selectedProductType: string;
  selectedBySku: string;
  selectedFragrance: string;
  usageType: string;
  hasGiftBox: boolean;
  isPreviewVisible: boolean;
  hasGenerated: boolean;
  articleStockCache: [string, number][];
  timestamp: number;
}

/**
 * 草稿持久化 Composable
 * 负责草稿的保存、加载和清除（使用 localStorage）
 */
export function useBundleDraft() {
  /**
   * 保存草稿到 localStorage
   */
  const saveDraft = (data: Partial<DraftData>) => {
    try {
      const draft: DraftData = {
        bundleItems: data.bundleItems || [],
        bundleName: data.bundleName || "",
        endDate: data.endDate || "",
        createTime: data.createTime || "",
        virtualCode: data.virtualCode || "",
        selectedCategory: data.selectedCategory || "",
        selectedProductType: data.selectedProductType || "",
        selectedBySku: data.selectedBySku || "",
        selectedFragrance: data.selectedFragrance || "",
        usageType: data.usageType || "cooperation",
        hasGiftBox: data.hasGiftBox || false,
        isPreviewVisible: data.isPreviewVisible || false,
        hasGenerated: data.hasGenerated || false,
        articleStockCache: data.articleStockCache || [],
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error("保存草稿失败:", e);
    }
  };

  /**
   * 从 localStorage 加载草稿
   */
  const loadDraft = (): DraftData | null => {
    try {
      const draftStr = localStorage.getItem(STORAGE_KEY);
      if (!draftStr) return null;

      const draft = JSON.parse(draftStr);
      return draft;
    } catch (e) {
      console.error("加载草稿失败:", e);
      return null;
    }
  };

  /**
   * 清除草稿
   */
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("清除草稿失败:", e);
    }
  };

  /**
   * 自动保存草稿（监听数据变化）
   */
  const setupAutoSave = (refs: any[], callback: () => Partial<DraftData>) => {
    watch(
      refs,
      () => {
        const data = callback();
        saveDraft(data);
      },
      { deep: true }
    );
  };

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    setupAutoSave,
  };
}
