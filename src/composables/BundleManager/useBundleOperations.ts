import { ElMessage, ElMessageBox } from "element-plus";
import type { BundleRecord } from "./useBundleList";

/**
 * 货组操作 Composable
 * 负责货组的删除、导出等操作
 */

export function useBundleOperations() {
  // 删除单个货组
  const handleDelete = async (row: BundleRecord, onSuccess: () => void) => {
    try {
      let confirmMsg = "确定要删除该货组吗？";

      await ElMessageBox.confirm(confirmMsg, "提示", {
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
  // 批量删除货组
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

  // 批量导出货组
  const handleBatchExport = async (
    bundles: BundleRecord[],
    exportOptions: { exportSku: boolean; exportVirtual: boolean }
  ) => {
    console.log("==== 前端：开始批量导出 ====");
    console.log("导出选项:", exportOptions);

    if (bundles.length === 0) {
      ElMessage.warning("请先选择要导出的货组");
      return;
    }

    try {
      const ids = bundles.map((b) => b.id);
      console.log("货组IDs:", ids);

      // 根据选择执行导出
      let successCount = 0;
      let failCount = 0;

      if (exportOptions.exportSku) {
        console.log("前端：调用 SKU 导出...");
        const res = await (window as any).electronAPI.batchExportBundles(
          ids,
          "sku"
        );
        console.log("前端：SKU 导出结果:", res);
        // 如果用户取消，不算失败
        if (res && res.success) {
          successCount++;
        } else if (!res?.canceled) {
          failCount++;
        }
      }

      if (exportOptions.exportVirtual) {
        console.log("前端：调用虚拟组套导出...");
        const res = await (window as any).electronAPI.batchExportBundles(
          ids,
          "virtual"
        );
        console.log("前端：虚拟组套导出结果:", res);
        // 如果用户取消，不算失败
        if (res && res.success) {
          successCount++;
        } else if (!res?.canceled) {
          failCount++;
        }
      }

      if (successCount > 0 && failCount === 0) {
        ElMessage.success("导出成功");
      } else if (successCount > 0 && failCount > 0) {
        ElMessage.warning("部分导出成功");
      } else if (failCount > 0) {
        ElMessage.error("导出失败");
      }
      // 如果 successCount 和 failCount 都为 0，说明用户取消了所有操作，不显示任何消息
    } catch (e) {
      console.error("批量导出出错:", e);
      ElMessage.error("批量导出出错");
    }
  };

  return {
    handleDelete,
    handleBatchDelete,
    handleBatchExport,
  };
}
