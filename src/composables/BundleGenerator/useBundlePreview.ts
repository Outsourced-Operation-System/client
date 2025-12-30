import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

// 定义库存不足商品类型
export interface InsufficientItem {
  sku: string;
  article_code: string;
  product_name_cn: string;
  qty_available: number;
}

/**
 * 货组预览面板 Composable
 * 负责预览面板的状态管理和货组保存
 */
export function useBundlePreview() {
  // 预览面板状态
  const isPreviewVisible = ref(false);
  const hasGenerated = ref(false);

  // 货组信息
  const bundleName = ref("");
  const endDate = ref(
    (() => {
      const now = new Date();
      const year = now.getFullYear() + 100;
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })()
  );
  const createTime = ref("");
  const virtualCode = ref("");
  const selectedCategory = ref("");
  const selectedProductType = ref("");
  const selectedBySku = ref("");
  const selectedFragrance = ref("");
  const usageType = ref("cooperation");
  const hasGiftBox = ref(false);

  // 生成虚拟编码
  const generateVirtualCode = async (bundleItems: any[] = []) => {
    try {
      // 筛选主品
      const mainItems = bundleItems.filter((item) => item.type === "main");

      let code = "";

      // 如果只有一个主品，直接使用主品的SKU码
      if (mainItems.length === 1) {
        code = mainItems[0].article_code;
      } else {
        // 如果主品数量多于1个或没有主品，使用现有的编码规则
        // const now = new Date();
        // const year = now.getFullYear();
        // const month = String(now.getMonth() + 1).padStart(2, "0");
        // const day = String(now.getDate()).padStart(2, "0");

        // 获取今天已有的货组数量
        const res = await (window as any).electronAPI.getTodayBundleCount();
        const sequence = String((res.count || 0) + 1).padStart(6, "0");

        code = `BD${sequence}`;
      }

      // 如果有礼盒，添加前缀
      if (hasGiftBox.value) {
        code = "Gbox_" + code;
      }

      return code;
    } catch (e) {
      console.error("生成虚拟编码失败:", e);
      // 降级方案：使用时间戳
      ElMessage.error("生成虚拟编码失败，使用时间戳作为编码");
      const timestamp = String(Date.now()).slice(-4);
      let code = `BD${timestamp.slice(-6)}`;
      if (hasGiftBox.value) {
        code = "Gbox_" + code;
      }
      return code;
    }
  };

  // 自动更新虚拟编码
  watch(hasGiftBox, async () => {
    if (virtualCode.value) {
      const baseCode = virtualCode.value.replace("Gbox_", "");
      virtualCode.value = hasGiftBox.value ? `Gbox_${baseCode}` : baseCode;
    }
  });

  // 显示预览并生成虚拟编码
  const showPreviewAndSave = async (bundleItems: any[] = []) => {
    // 生成创建时间和虚拟编码
    const now = new Date();
    createTime.value = `${now.getFullYear()}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    virtualCode.value = await generateVirtualCode(bundleItems);
    if (!hasGenerated.value) ElMessage.success("请在右侧填写货组信息并保存");
    isPreviewVisible.value = true;
    hasGenerated.value = true;
  };

  // 更新虚拟编码
  const updateVirtualCode = async (bundleItems: any[] = []) => {
    if (isPreviewVisible.value) {
      virtualCode.value = await generateVirtualCode(bundleItems);
    }
  };

  // 切换预览面板显示状态
  const togglePreview = () => {
    isPreviewVisible.value = !isPreviewVisible.value;
  };

  // 检查库存是否充足
  const checkStockAvailability = async (
    bundleItems: any[]
  ): Promise<{
    sufficient: boolean;
    insufficientItems: InsufficientItem[];
  }> => {
    try {
      const res = await (window as any).electronAPI.checkStockAvailability(
        bundleItems.map((item) => ({
          sku: item.sku || item.tu,
          article_code: item.article_code,
          product_name_cn: item.product_name_cn,
        }))
      );
      if (res.success) {
        return {
          sufficient: res.sufficient,
          insufficientItems: res.insufficientItems || [],
        };
      }
      return { sufficient: true, insufficientItems: [] };
    } catch (e) {
      console.error("检查库存失败:", e);
      return { sufficient: true, insufficientItems: [] };
    }
  };

  // 保存货组
  const saveBundle = async (
    bundleItems: any[],
    mainValue: string,
    giftValue: string,
    totalValue: string
  ): Promise<
    | { success: true }
    | {
        success: false;
        reason: "validation" | "stock";
        insufficientItems?: InsufficientItem[];
      }
  > => {
    // 验证必填项
    if (!bundleName.value) {
      ElMessage.warning("请输入货组名称");
      return { success: false, reason: "validation" };
    }

    if (!endDate.value) {
      ElMessage.warning("请选择结束日期");
      return { success: false, reason: "validation" };
    }

    if (!selectedCategory.value) {
      ElMessage.warning("请选择分类");
      return { success: false, reason: "validation" };
    }

    if (!selectedProductType.value) {
      ElMessage.warning("请选择品类");
      return { success: false, reason: "validation" };
    }

    if (!selectedBySku.value) {
      ElMessage.warning("请选择By-SKU");
      return { success: false, reason: "validation" };
    }

    if (!selectedFragrance.value) {
      ElMessage.warning("请选择香型");
      return { success: false, reason: "validation" };
    }

    if (bundleItems.length === 0) {
      ElMessage.warning("货组中没有商品");
      return { success: false, reason: "validation" };
    }

    // 检查库存是否充足
    const stockCheck = await checkStockAvailability(bundleItems);
    if (!stockCheck.sufficient) {
      return {
        success: false,
        reason: "stock",
        insufficientItems: stockCheck.insufficientItems,
      };
    }

    const bundleData = {
      name: bundleName.value,
      virtualCode: virtualCode.value,
      endDate: endDate.value,
      items: JSON.parse(JSON.stringify(bundleItems)),
      mainValue: parseFloat(mainValue),
      giftValue: parseFloat(giftValue),
      totalValue: parseFloat(totalValue),
      category: selectedCategory.value,
      productType: selectedProductType.value,
      bySku: selectedBySku.value,
      fragrance: selectedFragrance.value,
      usageType: usageType.value,
    };

    try {
      const res = await (window as any).electronAPI.createBundle(bundleData);
      if (res.success) {
        ElMessage.success(`货组保存成功！虚拟编码：${virtualCode.value}`);
        return { success: true };
      } else {
        ElMessage.error("保存失败: " + res.error);
        return { success: false, reason: "validation" };
      }
    } catch (e) {
      console.error(e);
      ElMessage.error("保存出错");
      return { success: false, reason: "validation" };
    }
  };

  const resetPreview = () => {
    bundleName.value = "";
    const now = new Date();
    const year = now.getFullYear() + 100;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    endDate.value = `${year}-${month}-${day}`;
    createTime.value = "";
    virtualCode.value = "";
    selectedCategory.value = "";
    selectedProductType.value = "";
    selectedBySku.value = "";
    selectedFragrance.value = "";
    usageType.value = "cooperation";
    hasGiftBox.value = false;
    isPreviewVisible.value = false;
    hasGenerated.value = false;
  };

  return {
    isPreviewVisible,
    hasGenerated,
    bundleName,
    endDate,
    createTime,
    virtualCode,
    selectedCategory,
    selectedProductType,
    selectedBySku,
    selectedFragrance,
    usageType,
    hasGiftBox,

    showPreviewAndSave,
    togglePreview,
    saveBundle,
    resetPreview,
    generateVirtualCode,
    updateVirtualCode,
  };
}
