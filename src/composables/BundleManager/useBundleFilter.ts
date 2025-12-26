import { ref } from "vue";
/**
 * 货组过滤 Composable
 * 负责管理货组列表的过滤条件
 */

export interface BundleFilters {
  keyword: string;
  startDate?: string;
  endDate?: string;
}
// 货组过滤管理
export function useBundleFilter() {
  const dateRange = ref<[Date, Date] | "">("");
  const keyword = ref("");

  const resetFilter = () => {
    keyword.value = "";
    dateRange.value = "";
  };
  // 获取当前过滤条件
  const getFilters = (): BundleFilters => {
    const filters: BundleFilters = {
      keyword: keyword.value,
    };

    if (dateRange.value && Array.isArray(dateRange.value)) {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      filters.startDate = formatDate(dateRange.value[0]);
      filters.endDate = formatDate(dateRange.value[1]);
    }

    return filters;
  };

  return {
    dateRange,
    keyword,
    resetFilter,
    getFilters,
  };
}
