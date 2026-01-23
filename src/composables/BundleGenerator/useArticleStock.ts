import { ref } from "vue";
import { productApi } from "@/api";

/**
 * A码库存管理 Composable
 * 负责查询和缓存 A码 的库存总数
 */

// A码库存缓存
export function useArticleStock() {
  // A码库存缓存
  const articleStockCache = ref<Map<string, number>>(new Map());

  const getArticleStockTotal = (articleCode: string): number => {
    if (!articleCode) return 0;
    return articleStockCache.value.get(articleCode) || 0;
  };

  const fetchArticleStockTotal = async (
    articleCode: string,
    forceRefresh = false,
  ) => {
    if (!articleCode) return;
    if (!forceRefresh && articleStockCache.value.has(articleCode)) return;

    try {
      const res = await productApi.getArticleStockTotal(articleCode);
      if (res && typeof res.total === "number") {
        articleStockCache.value.set(articleCode, res.total);
      }
    } catch (e) {
      console.error("查询A码库存失败:", e);
    }
  };

  // 批量获取 A码 库存总数
  const fetchBatchArticleStock = (
    articleCodes: string[],
    forceRefresh = false,
  ) => {
    articleCodes.forEach((code) => {
      if (code) fetchArticleStockTotal(code, forceRefresh);
    });
  };

  // 强制刷新所有已缓存的 A码 库存
  const refreshAllArticleStock = async () => {
    const articleCodes = Array.from(articleStockCache.value.keys());
    for (const code of articleCodes) {
      await fetchArticleStockTotal(code, true);
    }
  };

  // 清除库存缓存
  const clearStockCache = () => {
    articleStockCache.value.clear();
  };

  return {
    articleStockCache,
    getArticleStockTotal,
    fetchArticleStockTotal,
    fetchBatchArticleStock,
    refreshAllArticleStock,
    clearStockCache,
  };
}
