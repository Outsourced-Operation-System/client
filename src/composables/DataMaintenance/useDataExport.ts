import { ElMessage } from "element-plus";

export function useDataExport() {
  const handleExportGoods = async () => {
    try {
      const res = await (window as any).electronAPI.exportGoods();
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
      const res = await (window as any).electronAPI.exportInventory();
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

  return {
    handleExportGoods,
    handleExportInventory,
  };
}
