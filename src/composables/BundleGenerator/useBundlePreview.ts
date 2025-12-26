import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

export function useBundlePreview() {
  // 预览面板状态
  const isPreviewVisible = ref(false);
  const hasGenerated = ref(false);

  // 货组信息
  const bundleName = ref("");
  const endDate = ref("");
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
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        // 获取今天已有的货组数量
        const res = await (window as any).electronAPI.getTodayBundleCount();
        const sequence = String((res.count || 0) + 1).padStart(4, "0");

        code = `BD${year}${month}${day}${sequence}`;
      }

      // 如果有礼盒，添加前缀
      if (hasGiftBox.value) {
        code = "Gbox_" + code;
      }

      return code;
    } catch (e) {
      console.error("生成虚拟编码失败:", e);
      // 降级方案：使用时间戳
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const timestamp = String(now.getTime()).slice(-4);
      let code = `BD${year}${month}${day}${timestamp}`;
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

  // 保存货组
  const saveBundle = async (
    bundleItems: any[],
    mainValue: string,
    giftValue: string,
    totalValue: string
  ) => {
    // 验证必填项
    if (!bundleName.value) {
      ElMessage.warning("请输入货组名称");
      return false;
    }

    if (!endDate.value) {
      ElMessage.warning("请选择结束日期");
      return false;
    }

    if (!selectedCategory.value) {
      ElMessage.warning("请选择分类");
      return false;
    }

    if (!selectedProductType.value) {
      ElMessage.warning("请选择品类");
      return false;
    }

    if (!selectedBySku.value) {
      ElMessage.warning("请选择By-SKU");
      return false;
    }

    if (!selectedFragrance.value) {
      ElMessage.warning("请选择香型");
      return false;
    }

    if (bundleItems.length === 0) {
      ElMessage.warning("货组中没有商品");
      return false;
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
        return true;
      } else {
        ElMessage.error("保存失败: " + res.error);
        return false;
      }
    } catch (e) {
      console.error(e);
      ElMessage.error("保存出错");
      return false;
    }
  };

  const resetPreview = () => {
    bundleName.value = "";
    endDate.value = "";
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
