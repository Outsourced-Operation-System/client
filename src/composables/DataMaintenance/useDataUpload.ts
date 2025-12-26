import { ref } from "vue";
import { ElMessage } from "element-plus";
/**
 * 数据上传 Composable
 * 负责货品数据、库存数据和标签数据的上传
 */
export type UploadType = "product" | "inventory" | "label";
export type UploadMode = "update" | "overwrite";

export function useDataUpload(onUploadSuccess: () => void) {
  const uploadDialogVisible = ref(false);
  const overwriteConfirmVisible = ref(false);
  const pendingFile = ref<any>(null);
  const pendingType = ref<UploadType>("product");

  // 处理货品文件选择
  const handleProductFileChange = async (file: any) => {
    pendingFile.value = file.raw;
    pendingType.value = "product";

    try {
      const res = await (window as any).electronAPI.getStats();
      if (res.count === 0) {
        handleUploadWithMode("overwrite");
      } else {
        uploadDialogVisible.value = true;
      }
    } catch (e) {
      console.error("获取统计信息失败:", e);
      uploadDialogVisible.value = true;
    }
  };
  // 处理库存文件选择
  const handleInventoryFileChange = async (file: any) => {
    pendingFile.value = file.raw;
    pendingType.value = "inventory";

    try {
      const res = await (window as any).electronAPI.getStats();
      if (res.inventoryCount === 0) {
        handleUploadWithMode("overwrite");
      } else {
        uploadDialogVisible.value = true;
      }
    } catch (e) {
      console.error("获取统计信息失败:", e);
      uploadDialogVisible.value = true;
    }
  };
  // 处理标签文件选择
  const handleLabelFileChange = async (file: any) => {
    pendingFile.value = file.raw;
    pendingType.value = "label";
    handleUploadWithMode("overwrite");
  };
  // 确认覆盖上传
  const confirmOverwrite = () => {
    uploadDialogVisible.value = false;
    overwriteConfirmVisible.value = true;
  };
  // 根据上传模式执行上传
  const handleUploadWithMode = async (mode: UploadMode) => {
    uploadDialogVisible.value = false;
    overwriteConfirmVisible.value = false;

    if (!pendingFile.value) {
      ElMessage.error("没有待上传的文件");
      return;
    }

    const filePath = (window as any).electronAPI.getPathForFile(
      pendingFile.value
    );

    if (!filePath) {
      console.error(
        "无法获取文件路径，pendingFile 对象结构:",
        JSON.stringify(pendingFile.value, null, 2)
      );
      ElMessage.error("无法获取文件路径，请重新选择文件");
      pendingFile.value = null;
      return;
    }

    try {
      const res = await (window as any).electronAPI.importData(
        pendingType.value,
        filePath,
        mode
      );
      if (res.success) {
        const modeText = "更新";
        const typeText =
          pendingType.value === "product"
            ? "商品"
            : pendingType.value === "inventory"
            ? "库存"
            : "标签";
        ElMessage.success(`成功${modeText}了 ${res.count} 条${typeText}数据`);
        onUploadSuccess();
      } else {
        console.error("导入失败详情:", res.error);
        ElMessage.error("导入失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("导入出错详情:", e);
      console.error("错误堆栈:", e?.stack);
      ElMessage.error("导入出错: " + (e?.message || String(e)));
    } finally {
      pendingFile.value = null;
    }
  };

  return {
    uploadDialogVisible,
    overwriteConfirmVisible,
    pendingFile,
    pendingType,
    handleProductFileChange,
    handleInventoryFileChange,
    handleLabelFileChange,
    confirmOverwrite,
    handleUploadWithMode,
  };
}
