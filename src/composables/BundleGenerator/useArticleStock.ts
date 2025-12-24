import { ref } from "vue";

/**
 * A码库存管理 Composable
 * 负责查询和缓存 A码 的库存总数
 */
export function useArticleStock() {
  // A码库存缓存
  const articleStockCache = ref<Map<string, number>>(new Map());

  /**
   * 获取指定A码的库存总数（从缓存中返回）
   */
  const getArticleStockTotal = (articleCode: string): number => {
    if (!articleCode) return 0;
    return articleStockCache.value.get(articleCode) || 0;
  };

  /**
   * 查询A码库存总数（从数据库）
   */
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

  /**
   * 批量查询A码库存
   */
  const fetchBatchArticleStock = (articleCodes: string[]) => {
    articleCodes.forEach((code) => {
      if (code) fetchArticleStockTotal(code);
    });
  };

  /**
   * 清空库存缓存
   */
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
