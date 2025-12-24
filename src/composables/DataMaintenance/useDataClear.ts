import { ref } from "vue";
import { ElMessage } from "element-plus";

export function useDataClear(onClearSuccess: () => void) {
  const clearGoodsConfirmVisible = ref(false);
  const clearInventoryConfirmVisible = ref(false);

  const confirmClearGoods = () => {
    clearGoodsConfirmVisible.value = true;
  };

  const handleClearGoods = async () => {
    clearGoodsConfirmVisible.value = false;
    try {
      const res = await (window as any).electronAPI.clearGoods();
      if (res.success) {
        ElMessage.success("货品数据已成功删除");
        onClearSuccess();
      } else {
        ElMessage.error("删除货品数据失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("删除货品数据出错:", e);
      ElMessage.error("删除货品数据出错: " + (e?.message || String(e)));
    }
  };

  const confirmClearInventory = () => {
    clearInventoryConfirmVisible.value = true;
  };

  const handleClearInventory = async () => {
    clearInventoryConfirmVisible.value = false;
    try {
      const res = await (window as any).electronAPI.clearInventory();
      if (res.success) {
        ElMessage.success("库存数据已成功删除");
        onClearSuccess();
      } else {
        ElMessage.error("删除库存数据失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("删除库存数据出错:", e);
      ElMessage.error("删除库存数据出错: " + (e?.message || String(e)));
    }
  };

  return {
    clearGoodsConfirmVisible,
    clearInventoryConfirmVisible,
    confirmClearGoods,
    handleClearGoods,
    confirmClearInventory,
    handleClearInventory,
  };
}
