import { ElMessage } from "element-plus";
import { dataApi } from "@/api";

// 注意：electronAPI 类型已在 src/types/electron.d.ts 中全局声明

/**
 * 数据导出 Composable
 * 负责货品数据、库存数据和标签数据的导出
 */
export function useDataExport() {
  // 通用导出函数
  const exportToFile = async (
    fetchData: () => Promise<Blob>,
    defaultFileName: string,
    successMessage: string,
  ) => {
    try {
      if (!window.electronAPI) {
        ElMessage.error("当前环境不支持文件导出");
        return;
      }

      // 1. 先让用户选择保存路径
      const result = await window.electronAPI.showSaveDialog({
        title: "选择保存位置",
        defaultPath: defaultFileName,
        filters: [{ name: "Excel 文件", extensions: ["xlsx"] }],
      });

      if (result.canceled || !result.filePath) {
        return; // 用户取消了
      }

      // 2. 从后端获取文件数据
      const blob = await fetchData();

      // 3. 将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // 4. 保存到用户选择的路径
      const saveResult = await window.electronAPI.saveFile(
        result.filePath,
        arrayBuffer,
      );

      if (saveResult.success) {
        ElMessage.success(`${successMessage} ${result.filePath}`);
      } else {
        ElMessage.error("保存失败: " + (saveResult.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("导出出错:", e);
      ElMessage.error("导出出错: " + (e?.message || String(e)));
    }
  };

  const handleExportProducts = async () => {
    await exportToFile(
      () => dataApi.exportProducts(),
      `货品导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
      "成功导出货品数据到",
    );
  };

  const handleExportInventory = async () => {
    await exportToFile(
      () => dataApi.exportInventory(),
      `库存导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
      "成功导出库存数据到",
    );
  };

  const handleExportLabels = async () => {
    await exportToFile(
      () => dataApi.exportLabels(),
      `标签导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
      "成功导出标签数据到",
    );
  };

  return {
    handleExportProducts,
    handleExportInventory,
    handleExportLabels,
  };
}
