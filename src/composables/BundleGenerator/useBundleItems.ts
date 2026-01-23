import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { productApi } from "@/api";

export interface BundleItem {
  uid: string; // 唯一标识，支持同一商品多次添加
  sku?: string;
  article_code?: string;
  tu?: string;
  product_name_cn?: string;
  product_name_en?: string;
  qty_available?: number;
  tu_shelf_life?: string;
  declared_content?: string;
  cn_current_price?: number;
  shelf_life?: string;
  type: "main" | "gift";
  remaining_months?: string;
}

// 生成唯一ID
const generateUid = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 货组商品列表管理 Composable
 * 负责商品的增删改查和货值计算
 */

// 货组商品列表
export function useBundleItems() {
  // 货组商品列表
  const bundleItems = ref<BundleItem[]>([]);

  // 添加单个商品（允许添加相同商品）
  const addItem = (item: any) => {
    bundleItems.value.push({
      ...item,
      uid: generateUid(),
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

  // 复制商品（在指定位置后面插入相同商品的副本）
  const copyItem = (index: number) => {
    if (index < 0 || index >= bundleItems.value.length) {
      return false;
    }
    const item = bundleItems.value[index];
    if (!item) {
      return false;
    }
    const newItem: BundleItem = {
      ...item,
      uid: generateUid(),
      type: item.type,
    };
    // 在当前位置后面插入副本
    bundleItems.value.splice(index + 1, 0, newItem);
    ElMessage.success("已复制商品");
    return true;
  };

  // 移除商品
  const removeItem = (index: number) => {
    bundleItems.value.splice(index, 1);
  };

  const clearAll = () => {
    bundleItems.value = [];
  };

  // 刷新所有商品的库存数量
  const refreshItemsStock = async () => {
    if (bundleItems.value.length === 0) return;

    const skus = bundleItems.value
      .map((item) => item.tu)
      .filter((tu): tu is string => tu !== undefined);
    if (skus.length === 0) return;

    try {
      const res = await productApi.getBatchSkuStock(skus);
      if (res) {
        const stockMap = new Map(
          Object.entries(res).map(([sku, qty]) => [sku, qty]),
        );
        bundleItems.value.forEach((item) => {
          if (item.tu) {
            const newStock = stockMap.get(item.tu);
            if (newStock !== undefined && newStock !== null) {
              item.qty_available = Number(newStock);
            }
          }
        });
      }
    } catch (e) {
      console.error("刷新库存失败:", e);
    }
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
      2,
    );
  });

  // 获取所有唯一的 A码 列表
  const getArticleCodes = computed(() => {
    return [
      ...new Set(
        bundleItems.value.map((item) => item.article_code).filter(Boolean),
      ),
    ];
  });

  return {
    bundleItems,
    addItem,
    addItems,
    copyItem,
    removeItem,
    clearAll,
    refreshItemsStock,
    mainValue,
    giftValue,
    totalValue,
    getArticleCodes,
  };
}
