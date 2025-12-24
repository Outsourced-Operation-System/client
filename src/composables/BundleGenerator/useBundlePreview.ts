import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

/**
 * 货组预览与保存 Composable
 * 负责预览面板的显示、货组信息管理和保存逻辑
 */
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

  /**
   * 生成虚拟编码
   */
  const generateVirtualCode = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      // 获取今天已有的货组数量
      const res = await (window as any).electronAPI.getTodayBundleCount();
      const sequence = String((res.count || 0) + 1).padStart(4, "0");

      let code = `BD${year}${month}${day}${sequence}`;

      // 如果有礼盒，添加后缀
      if (hasGiftBox.value) {
        code = code + "Gbox_";
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
        code = code + "Gbox_";
      }
      return code;
    }
  };

  /**
   * 监听礼盒选项变化，自动更新虚拟编码
   */
  watch(hasGiftBox, async () => {
    if (virtualCode.value) {
      const baseCode = virtualCode.value.replace("Gbox_", "");
      virtualCode.value = hasGiftBox.value ? `${baseCode}Gbox_` : baseCode;
    }
  });

  /**
   * 显示预览并准备保存
   */
  const showPreviewAndSave = async () => {
    // 生成创建时间和虚拟编码
    const now = new Date();
    createTime.value = `${now.getFullYear()}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    virtualCode.value = await generateVirtualCode();
    ElMessage.success("请在右侧填写货组信息并保存");
    isPreviewVisible.value = true;
    hasGenerated.value = true;
  };

  /**
   * 切换预览面板
   */
  const togglePreview = () => {
    isPreviewVisible.value = !isPreviewVisible.value;
  };

  /**
   * 保存货组
   */
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
      createTime: createTime.value,
      startDate: createTime.value,
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
      hasGiftBox: hasGiftBox.value,
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

  /**
   * 重置所有预览信息
   */
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
    // 状态
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

    // 方法
    showPreviewAndSave,
    togglePreview,
    saveBundle,
    resetPreview,
    generateVirtualCode,
  };
}
