import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

/**
 * 商品搜索 Composable
 * 负责商品搜索、自动补全、搜索结果弹窗管理
 */
export function useProductSearch() {
  // 搜索相关
  const searchQuery = ref("");
  const searchType = ref("productName");
  const filterZeroStock = ref(false);
  const suggestionUsed = ref(false);

  // 搜索结果弹窗
  const showSearchResultDialog = ref(false);
  const searchDialogResults = ref<any[]>([]);
  const dialogSelectedItems = ref<any[]>([]);
  const searchDialogTable = ref<any>(null);

  /**
   * 自动完成搜索建议
   */
  const querySearch = async (queryString: string, cb: any) => {
    if (
      !queryString ||
      searchType.value !== "productName" ||
      suggestionUsed.value
    ) {
      cb([]);
      return;
    }

    try {
      const res = await (window as any).electronAPI.searchProductSuggestions(
        String(queryString)
      );
      const suggestions = res.map((item: any) => ({
        value: item.product_name_cn,
        ...item,
      }));
      cb(suggestions);
    } catch (e) {
      console.error(e);
      cb([]);
    }
  };

  /**
   * 选中搜索建议
   */
  const handleSelect = (item: any, onSearch: () => void) => {
    searchQuery.value = item.value;
    onSearch();
  };

  /**
   * 监听搜索词变化，清除"已使用建议"标志
   */
  watch(searchQuery, () => {
    suggestionUsed.value = false;
  });

  /**
   * 快速搜索（打开关键信息列表弹窗）
   */
  const handleQuickSearch = async () => {
    if (!searchQuery.value.trim()) {
      ElMessage.warning("请输入搜索内容");
      return;
    }

    try {
      console.log("搜索参数:", {
        query: searchQuery.value,
        type: searchType.value,
        filterZeroStock: filterZeroStock.value,
      });

      const res = await (window as any).electronAPI.searchProductsByTypes(
        String(searchQuery.value),
        [searchType.value],
        Boolean(filterZeroStock.value)
      );

      console.log("搜索结果:", res);

      if (res && res.length > 0) {
        searchDialogResults.value = res;
        showSearchResultDialog.value = true;

        // 如果只有一个商品，自动勾选
        if (res.length === 1) {
          setTimeout(() => {
            if (searchDialogTable.value && res[0]) {
              searchDialogTable.value.toggleRowSelection(res[0], true);
            }
          }, 100);
        }
      } else {
        ElMessage.info("未找到匹配的商品");
      }
    } catch (e: any) {
      console.error("搜索错误详情:", e);
      ElMessage.error(`搜索出错: ${e.message || "未知错误"}`);
    }
  };

  /**
   * 关键信息列表选择
   */
  const handleDialogSelectionChange = (val: any[]) => {
    dialogSelectedItems.value = val;
  };

  /**
   * 点击行时切换选中状态
   */
  const handleRowClick = (row: any) => {
    if (!searchDialogTable.value) return;
    searchDialogTable.value.toggleRowSelection(row);
  };

  /**
   * 获取选中的商品并关闭弹窗
   */
  const getSelectedItems = () => {
    if (dialogSelectedItems.value.length === 0) {
      ElMessage.warning("请至少选择一个商品");
      return null;
    }
    suggestionUsed.value = true;
    const items = [...dialogSelectedItems.value];
    showSearchResultDialog.value = false;
    dialogSelectedItems.value = [];
    return items;
  };

  /**
   * 关闭搜索弹窗
   */
  const closeSearchDialog = () => {
    showSearchResultDialog.value = false;
    dialogSelectedItems.value = [];
  };

  return {
    // 搜索状态
    searchQuery,
    searchType,
    filterZeroStock,
    suggestionUsed,

    // 弹窗状态
    showSearchResultDialog,
    searchDialogResults,
    dialogSelectedItems,
    searchDialogTable,

    // 方法
    querySearch,
    handleSelect,
    handleQuickSearch,
    handleDialogSelectionChange,
    handleRowClick,
    getSelectedItems,
    closeSearchDialog,
  };
}
