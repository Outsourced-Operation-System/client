import { ElMessage, ElMessageBox } from "element-plus";
import { bundleApi } from "@/api";
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

      const res = await bundleApi.deleteBundle(row.id);
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
    onSuccess: () => void,
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
        },
      );

      const ids = bundles.map((b) => b.id);
      const res = await bundleApi.batchDeleteBundles(ids);

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
    exportOptions: { exportSku: boolean; exportVirtual: boolean },
  ) => {
    if (bundles.length === 0) {
      ElMessage.warning("请先选择要导出的货组");
      return;
    }

    if (!window.electronAPI) {
      ElMessage.error("当前环境不支持文件导出");
      return;
    }

    try {
      const ids = bundles.map((b) => b.id);

      // 根据选择执行导出
      let successCount = 0;
      let failCount = 0;

      // 导出SKU表格
      if (exportOptions.exportSku) {
        const defaultFileName = `Rituals_SKU_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`;

        // 1. 先让用户选择保存路径
        const result = await window.electronAPI.showSaveDialog({
          title: "选择SKU表格保存位置",
          defaultPath: defaultFileName,
          filters: [{ name: "Excel 文件", extensions: ["xlsx"] }],
        });

        if (!result.canceled && result.filePath) {
          try {
            // 2. 从后端获取文件数据
            const blob = await bundleApi.batchExportBundles(ids, "sku");

            // 3. 将 Blob 转换为 ArrayBuffer
            const arrayBuffer = await blob.arrayBuffer();

            // 4. 保存到用户选择的路径
            const saveResult = await window.electronAPI.saveFile(
              result.filePath,
              arrayBuffer,
            );

            if (saveResult.success) {
              ElMessage.success(`SKU表格已保存到 ${result.filePath}`);
              successCount++;
            } else {
              ElMessage.error(
                "SKU表格保存失败: " + (saveResult.error || "未知错误"),
              );
              failCount++;
            }
          } catch (e: any) {
            console.error("SKU导出出错:", e);
            ElMessage.error("SKU导出出错: " + (e?.message || String(e)));
            failCount++;
          }
        }
      }

      // 导出虚拟组套表格
      if (exportOptions.exportVirtual) {
        const defaultFileName = `Rituals_Virtual_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`;

        // 1. 先让用户选择保存路径
        const result = await window.electronAPI.showSaveDialog({
          title: "选择虚拟组套表格保存位置",
          defaultPath: defaultFileName,
          filters: [{ name: "Excel 文件", extensions: ["xlsx"] }],
        });

        if (!result.canceled && result.filePath) {
          try {
            // 2. 从后端获取文件数据
            const blob = await bundleApi.batchExportBundles(ids, "virtual");

            // 3. 将 Blob 转换为 ArrayBuffer
            const arrayBuffer = await blob.arrayBuffer();

            // 4. 保存到用户选择的路径
            const saveResult = await window.electronAPI.saveFile(
              result.filePath,
              arrayBuffer,
            );

            if (saveResult.success) {
              ElMessage.success(`虚拟组套表格已保存到 ${result.filePath}`);
              successCount++;
            } else {
              ElMessage.error(
                "虚拟组套表格保存失败: " + (saveResult.error || "未知错误"),
              );
              failCount++;
            }
          } catch (e: any) {
            console.error("虚拟组套导出出错:", e);
            ElMessage.error("虚拟组套导出出错: " + (e?.message || String(e)));
            failCount++;
          }
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
