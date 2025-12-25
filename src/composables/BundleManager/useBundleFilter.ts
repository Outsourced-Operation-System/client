import { ref } from "vue";

export interface BundleFilters {
  keyword: string;
  startDate?: string;
  endDate?: string;
}

export function useBundleFilter() {
  const dateRange = ref<[Date, Date] | "">("");
  const keyword = ref("");

  const resetFilter = () => {
    keyword.value = "";
    dateRange.value = "";
  };

  const getFilters = (): BundleFilters => {
    const filters: BundleFilters = {
      keyword: keyword.value,
    };

    if (dateRange.value && Array.isArray(dateRange.value)) {
      filters.startDate = dateRange.value[0]?.toISOString().split("T")[0];
      filters.endDate = dateRange.value[1]?.toISOString().split("T")[0];
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
