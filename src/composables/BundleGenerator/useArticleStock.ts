import { ref } from "vue";

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

  const fetchArticleStockTotal = async (articleCode: string) => {
    if (!articleCode || articleStockCache.value.has(articleCode)) return;

    try {
      const res = await (window as any).electronAPI.getArticleStockTotal(
        articleCode
      );
      if (res && typeof res.total === "number") {
        articleStockCache.value.set(articleCode, res.total);
      }
    } catch (e) {
      console.error("查询A码库存失败:", e);
    }
  };
  // 批量获取 A码 库存总数
  const fetchBatchArticleStock = (articleCodes: string[]) => {
    articleCodes.forEach((code) => {
      if (code) fetchArticleStockTotal(code);
    });
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
    clearStockCache,
  };
}
