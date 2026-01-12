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
  parent_id?: number | null;
  children_count?: number;
  update_time?: string; // 子货组使用，显示更新时间
  last_update_time?: string; // 父货组的最后更新时间（最新子货组的创建时间）
  children?: BundleRecord[]; // 子货组列表
  expanded?: boolean; // 是否展开
  isChild?: boolean; // 是否是子货组
  selected?: boolean; // 是否选中
}

export function useBundleList() {
  const bundleList = ref<BundleRecord[]>([]);
  const selectedBundles = ref<BundleRecord[]>([]);
  const loading = ref(false);

  // 分页
  const currentPage = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  // 保存展开状态的Map
  const expandedMap = ref<Map<number, boolean>>(new Map());

  // 获取货组列表
  const fetchBundles = async (filters?: BundleFilters) => {
    loading.value = true;
    try {
      const res = await (window as any).electronAPI.getBundles({
        ...filters,
        page: currentPage.value,
        pageSize: pageSize.value,
      });

      let newList: BundleRecord[] = [];
      if (res && res.data) {
        newList = res.data.map((item: BundleRecord) => ({
          ...item,
          expanded: expandedMap.value.get(item.id) || false,
          children: [],
        }));
        total.value = res.total || 0;
      } else if (Array.isArray(res)) {
        newList = res.map((item: BundleRecord) => ({
          ...item,
          expanded: expandedMap.value.get(item.id) || false,
          children: [],
        }));
        total.value = res.length;
      } else {
        bundleList.value = [];
        total.value = 0;
        return;
      }

      // 恢复已展开的子货组
      const finalList: BundleRecord[] = [];
      for (const item of newList) {
        finalList.push(item);
        if (item.expanded && item.children_count && item.children_count > 0) {
          const children = await fetchChildBundles(item.id);
          item.children = children;
          finalList.push(...children);
        }
      }
      bundleList.value = finalList;
    } catch (e) {
      console.error("获取货组列表失败:", e);
      ElMessage.error("获取货组列表失败");
      bundleList.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  };

  // 获取子货组
  const fetchChildBundles = async (parentId: number) => {
    try {
      const res = await (window as any).electronAPI.getChildBundles(parentId);
      if (res.success && res.data) {
        return res.data.map((item: BundleRecord) => ({
          ...item,
          isChild: true,
        }));
      }
      return [];
    } catch (e) {
      console.error("获取子货组失败:", e);
      return [];
    }
  };

  // 展开/折叠子货组
  const toggleExpand = async (row: BundleRecord) => {
    const index = bundleList.value.findIndex((item) => item.id === row.id);
    if (index === -1) return;

    if (row.expanded) {
      // 折叠：移除子货组
      row.expanded = false;
      expandedMap.value.set(row.id, false);
      bundleList.value = bundleList.value.filter(
        (item) => item.parent_id !== row.id
      );
    } else {
      // 展开：加载并插入子货组
      const children = await fetchChildBundles(row.id);
      row.expanded = true;
      expandedMap.value.set(row.id, true);
      row.children = children;
      // 在父货组后面插入子货组
      bundleList.value.splice(index + 1, 0, ...children);
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
    fetchChildBundles,
    toggleExpand,
    handlePageChange,
    handleSelectionChange,
  };
}
