import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { labelApi } from "@/api";

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

  // 字段名称映射
  const fieldNameMap: Record<string, string> = {
    category: "分类",
    productType: "品类",
    bySku: "By-SKU",
    fragrance: "香型",
  };

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
      const res = await labelApi.searchLabels(field, query || "");

      // 更新对应的选项列表
      switch (field) {
        case "category":
          categories.value = res;
          break;
        case "productType":
          productTypes.value = res;
          break;
        case "bySku":
          bySkuList.value = res;
          break;
        case "fragrance":
          fragrances.value = res;
          break;
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

  // 删除标签
  const deleteLabel = async (field: string, value: string) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除${fieldNameMap[field]}标签"${value}"吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      const res = await labelApi.deleteLabel(field, value);

      if (res.success) {
        ElMessage.success("删除成功");
        // 刷新列表
        await searchLabels(field, "");
      } else {
        ElMessage.error(res.error || "删除失败");
      }
    } catch (e: any) {
      if (e !== "cancel") {
        console.error("删除标签失败:", e);
        ElMessage.error("删除失败");
      }
    }
  };

  // 新增标签
  const addLabel = async (field: string) => {
    try {
      const { value: newValue } = await ElMessageBox.prompt(
        `请输入新的${fieldNameMap[field]}标签`,
        "新增标签",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPattern: /\S+/,
          inputErrorMessage: "标签不能为空",
        },
      );

      if (!newValue || !newValue.trim()) {
        return;
      }

      const trimmedValue = newValue.trim();

      const res = await labelApi.addLabel(field, trimmedValue);

      if (res.success) {
        ElMessage.success("添加成功");
        // 刷新列表
        await searchLabels(field, "");
      } else if (res.exists) {
        ElMessage.warning("该标签已存在");
      } else {
        ElMessage.error(res.error || "添加失败");
      }
    } catch (e: any) {
      if (e !== "cancel") {
        console.error("添加标签失败:", e);
        ElMessage.error("添加失败");
      }
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
    deleteLabel,
    addLabel,
  };
}
