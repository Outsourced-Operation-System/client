import { ref } from "vue";
import { ElMessage } from "element-plus";
import { dataApi } from "@/api";
/**
 * 数据清理 Composable
 * 负责货品数据和库存数据的清理
 */
export function useDataClear(onClearSuccess: () => void) {
  const clearProductsConfirmVisible = ref(false);
  const clearInventoryConfirmVisible = ref(false);

  const confirmClearProducts = () => {
    clearProductsConfirmVisible.value = true;
  };
  // 执行删除货品数据
  const handleClearProducts = async () => {
    clearProductsConfirmVisible.value = false;
    try {
      const res = await dataApi.clearProducts();
      if (res.success) {
        ElMessage.success("货品数据已成功删除");
        onClearSuccess();
      } else {
        ElMessage.error("删除货品数据失败");
      }
    } catch (e: any) {
      console.error("删除货品数据出错:", e);
      ElMessage.error("删除货品数据出错: " + (e?.message || String(e)));
    }
  };
  // 执行删除库存数据
  const confirmClearInventory = () => {
    clearInventoryConfirmVisible.value = true;
  };
  // 执行删除库存数据
  const handleClearInventory = async () => {
    clearInventoryConfirmVisible.value = false;
    try {
      const res = await dataApi.clearInventory();
      if (res.success) {
        ElMessage.success("库存数据已成功删除");
        onClearSuccess();
      } else {
        ElMessage.error("删除库存数据失败");
      }
    } catch (e: any) {
      console.error("删除库存数据出错:", e);
      ElMessage.error("删除库存数据出错: " + (e?.message || String(e)));
    }
  };

  return {
    clearProductsConfirmVisible,
    clearInventoryConfirmVisible,
    confirmClearProducts,
    handleClearProducts,
    confirmClearInventory,
    handleClearInventory,
  };
}
