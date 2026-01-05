import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import type { BundleFilters } from "./useBundleFilter";

/**
 * 货组列表管理 Composable
 * 负责货组列表的获取、分页和选择管理
 */

export interface BundleRecord {
  id: number;
  virtual_code: string;
  name: string;
  create_date: string;
  end_date: string;
  usage_type: string;
  total_value: number;
  main_value: number;
  gift_value: number;
  category?: string;
  product_type?: string;
  by_sku?: string;
  fragrance?: string;
  status: string;
}

export function useBundleList() {
  const bundleList = ref<BundleRecord[]>([]);
  const selectedBundles = ref<BundleRecord[]>([]);
  const loading = ref(false);

  // 分页
  const currentPage = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  // 获取货组列表
  const fetchBundles = async (filters?: BundleFilters) => {
    loading.value = true;
    try {
      const res = await (window as any).electronAPI.getBundles({
        ...filters,
        page: currentPage.value,
        pageSize: pageSize.value,
      });

      if (res && res.data) {
        bundleList.value = res.data;
        total.value = res.total || 0;
      } else if (Array.isArray(res)) {
        bundleList.value = res;
        total.value = res.length;
      } else {
        bundleList.value = [];
        total.value = 0;
      }
    } catch (e) {
      console.error("获取货组列表失败:", e);
      ElMessage.error("获取货组列表失败");
      bundleList.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  };
  // 分页变化处理
  const handlePageChange = (page: number) => {
    currentPage.value = page;
  };
  // 选择变化处理
  const handleSelectionChange = (selection: BundleRecord[]) => {
    selectedBundles.value = selection;
  };
  const hasSelection = computed(() => selectedBundles.value.length > 0);

  return {
    bundleList,
    selectedBundles,
    loading,
    currentPage,
    pageSize,
    total,
    hasSelection,
    fetchBundles,
    handlePageChange,
    handleSelectionChange,
  };
}
