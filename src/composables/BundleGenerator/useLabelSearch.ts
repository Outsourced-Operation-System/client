import { ref } from "vue";

/**
 * 标签搜索 Composable
 * 负责分类、品类、By-SKU、香型等标签的远程搜索
 */
export function useLabelSearch() {
  const categories = ref<string[]>([]);
  const productTypes = ref<string[]>([]);
  const bySkuList = ref<string[]>([]);
  const fragrances = ref<string[]>([]);
  const categoryLoading = ref(false);
  const productTypeLoading = ref(false);
  const bySkuLoading = ref(false);
  const fragranceLoading = ref(false);

  // 搜索标签
  const searchLabels = async (field: string, query: string) => {
    try {
      switch (field) {
        case "category":
          categoryLoading.value = true;
          break;
        case "productType":
          productTypeLoading.value = true;
          break;
        case "bySku":
          bySkuLoading.value = true;
          break;
        case "fragrance":
          fragranceLoading.value = true;
          break;
      }

      // 无论是否有查询内容，都执行搜索
      // 空查询会返回所有数据（由后端limit控制数量）
      const res = await (window as any).electronAPI.searchLabels(
        field,
        query || ""
      );

      if (res.success) {
        // 更新对应的选项列表
        switch (field) {
          case "category":
            categories.value = res.data;
            break;
          case "productType":
            productTypes.value = res.data;
            break;
          case "bySku":
            bySkuList.value = res.data;
            break;
          case "fragrance":
            fragrances.value = res.data;
            break;
        }
      }
    } catch (e) {
      console.error("搜索标签失败:", e);
    } finally {
      // 清除加载状态
      categoryLoading.value = false;
      productTypeLoading.value = false;
      bySkuLoading.value = false;
      fragranceLoading.value = false;
    }
  };

  return {
    categories,
    productTypes,
    bySkuList,
    fragrances,
    categoryLoading,
    productTypeLoading,
    bySkuLoading,
    fragranceLoading,
    searchLabels,
  };
}
