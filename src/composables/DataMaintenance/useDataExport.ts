import { ElMessage } from "element-plus";
import { dataApi } from "@/api";
/**
 * 数据导出 Composable
 * 负责货品数据、库存数据和标签数据的导出
 */
export function useDataExport() {
  const handleExportProducts = async () => {
    try {
      const res = await dataApi.exportProducts();
      if (res.success) {
        ElMessage.success(`成功导出 ${res.count} 条记录到 ${res.filePath}`);
      } else {
        if (res.error !== "用户取消了保存") {
          console.error("导出失败:", res.error);
          ElMessage.error("导出失败: " + (res.error || "未知错误"));
        }
      }
    } catch (e: any) {
      console.error("导出出错:", e);
      ElMessage.error("导出出错: " + (e?.message || String(e)));
    }
  };

  const handleExportInventory = async () => {
    try {
      const res = await dataApi.exportInventory();
      if (res.success) {
        ElMessage.success(`成功导出 ${res.count} 条库存记录到 ${res.filePath}`);
      } else {
        if (res.error !== "用户取消了保存") {
          console.error("导出库存失败:", res.error);
          ElMessage.error("导出库存失败: " + (res.error || "未知错误"));
        }
      }
    } catch (e: any) {
      console.error("导出库存出错:", e);
      ElMessage.error("导出库存出错: " + (e?.message || String(e)));
    }
  };

  const handleExportLabels = async () => {
    try {
      const res = await dataApi.exportLabels();
      if (res.success) {
        ElMessage.success(`成功导出 ${res.count} 条标签记录到 ${res.filePath}`);
      } else {
        if (res.error !== "用户取消了保存") {
          console.error("导出标签失败:", res.error);
          ElMessage.error("导出标签失败: " + (res.error || "未知错误"));
        }
      }
    } catch (e: any) {
      console.error("导出标签出错:", e);
      ElMessage.error("导出标签出错: " + (e?.message || String(e)));
    }
  };

  return {
    handleExportProducts,
    handleExportInventory,
    handleExportLabels,
  };
}
