import { ref, computed } from "vue";
import { ElMessage } from "element-plus";

export interface BundleItem {
  id: number | string;
  article_code: string;
  tu: string;
  product_name_cn: string;
  product_name_en: string;
  qty_available: number;
  tu_shelf_life: string;
  declared_content: string;
  cn_current_price: number;
  shelf_life: string;
  type: "main" | "gift";
}

/**
 * 货组商品列表管理 Composable
 * 负责商品的增删改查和货值计算
 */

// 货组商品列表
export function useBundleItems() {
  // 货组商品列表
  const bundleItems = ref<BundleItem[]>([]);

  const addItem = (item: any) => {
    const exists = bundleItems.value.find((b) => b.id === item.id);
    if (exists) {
      return false;
    }
    bundleItems.value.push({
      ...item,
      type: "main",
    });
    return true;
  };

  // 批量添加商品
  const addItems = (items: any[]) => {
    let addedCount = 0;
    items.forEach((item) => {
      if (addItem(item)) {
        addedCount++;
      }
    });
    if (addedCount > 0) {
      ElMessage.success(`已添加 ${addedCount} 个商品`);
    }
    return addedCount;
  };

  // 移除商品
  const removeItem = (index: number) => {
    bundleItems.value.splice(index, 1);
  };

  const clearAll = () => {
    bundleItems.value = [];
  };

  // 计算主品货值
  const mainValue = computed(() => {
    return bundleItems.value
      .filter((item) => item.type === "main")
      .reduce((sum, item) => sum + (item.cn_current_price || 0), 0)
      .toFixed(2);
  });

  // 计算赠品货值
  const giftValue = computed(() => {
    return bundleItems.value
      .filter((item) => item.type === "gift")
      .reduce((sum, item) => sum + (item.cn_current_price || 0), 0)
      .toFixed(2);
  });

  // 计算总货值
  const totalValue = computed(() => {
    return (parseFloat(mainValue.value) + parseFloat(giftValue.value)).toFixed(
      2
    );
  });

  // 获取所有唯一的 A码 列表
  const getArticleCodes = computed(() => {
    return [
      ...new Set(
        bundleItems.value.map((item) => item.article_code).filter(Boolean)
      ),
    ];
  });

  return {
    bundleItems,
    addItem,
    addItems,
    removeItem,
    clearAll,
    mainValue,
    giftValue,
    totalValue,
    getArticleCodes,
  };
}
