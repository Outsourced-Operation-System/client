import { ElMessage, ElMessageBox } from "element-plus";
import type { BundleRecord } from "./useBundleList";

export function useBundleOperations() {
  const handleDelete = async (row: BundleRecord, onSuccess: () => void) => {
    try {
      await ElMessageBox.confirm("确定要删除该货组吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });

      const res = await (window as any).electronAPI.deleteBundle(row.id);
      if (res && res.success) {
        ElMessage.success("删除成功");
        onSuccess();
      } else {
        ElMessage.error(res?.message || "删除失败");
      }
    } catch (e: any) {
      if (e !== "cancel") {
        console.error("删除出错:", e);
        ElMessage.error("删除出错");
      }
    }
  };

  const handleBatchDelete = async (
    bundles: BundleRecord[],
    onSuccess: () => void
  ) => {
    if (bundles.length === 0) {
      ElMessage.warning("请先选择要删除的货组");
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${bundles.length} 个货组吗？`,
        "批量删除",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      );

      const ids = bundles.map((b) => b.id);
      const res = await (window as any).electronAPI.batchDeleteBundles(ids);

      if (res && res.success) {
        ElMessage.success(`成功删除 ${bundles.length} 个货组`);
        onSuccess();
      } else {
        ElMessage.error(res?.message || "批量删除失败");
      }
    } catch (e: any) {
      if (e !== "cancel") {
        console.error("批量删除出错:", e);
        ElMessage.error("批量删除出错");
      }
    }
  };

  const handleExport = async (row: BundleRecord) => {
    try {
      const res = await (window as any).electronAPI.exportBundle(row.id);
      if (res && res.success) {
        ElMessage.success("导出成功");
      } else {
        ElMessage.error(res?.message || "导出失败");
      }
    } catch (e) {
      console.error("导出出错:", e);
      ElMessage.error("导出出错");
    }
  };

  const handleBatchExport = async (bundles: BundleRecord[]) => {
    if (bundles.length === 0) {
      ElMessage.warning("请先选择要导出的货组");
      return;
    }

    try {
      const ids = bundles.map((b) => b.id);
      const res = await (window as any).electronAPI.batchExportBundles(ids);

      if (res && res.success) {
        ElMessage.success(`成功导出 ${bundles.length} 个货组`);
      } else {
        ElMessage.error(res?.message || "批量导出失败");
      }
    } catch (e) {
      console.error("批量导出出错:", e);
      ElMessage.error("批量导出出错");
    }
  };

  return {
    handleDelete,
    handleBatchDelete,
    handleExport,
    handleBatchExport,
  };
}
