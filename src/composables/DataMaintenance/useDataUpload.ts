import { ref } from "vue";
import { ElMessage } from "element-plus";
import { dataApi } from "@/api";
/**
 * 数据上传 Composable
 * 负责货品数据、库存数据和标签数据的上传
 */
export type UploadType = "product" | "inventory" | "label" | "combined";
export type UploadMode = "update" | "overwrite";

export function useDataUpload(onUploadSuccess: () => void) {
  const uploadDialogVisible = ref(false);
  const overwriteConfirmVisible = ref(false);
  const pendingFile = ref<File | null>(null);
  const pendingType = ref<UploadType>("product");

  // 处理货品文件选择
  const handleProductFileChange = async (file: any) => {
    pendingFile.value = file.raw;
    pendingType.value = "product";

    try {
      const res = await dataApi.getStats();
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
      const res = await dataApi.getStats();
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

  // 处理合表文件选择（包含三个sheet的Excel文件）
  const handleCombinedFileChange = async (file: any) => {
    pendingFile.value = file.raw;
    pendingType.value = "combined";

    try {
      const res = await dataApi.getStats();
      // 如果任一表为空，直接覆盖上传
      if (res.count === 0 || res.inventoryCount === 0) {
        handleUploadWithMode("overwrite");
      } else {
        uploadDialogVisible.value = true;
      }
    } catch (e) {
      console.error("获取统计信息失败:", e);
      uploadDialogVisible.value = true;
    }
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

    try {
      const res = await dataApi.importData(
        pendingType.value,
        pendingFile.value,
        mode,
      );
      if (res.success) {
        const modeText = "更新";
        if (pendingType.value === "combined") {
          ElMessage.success(
            `成功导入合表数据！货品: ${res.productCount} 条，库存: ${res.inventoryCount} 条，标签: ${res.labelCount} 条`,
          );
        } else {
          const typeText =
            pendingType.value === "product"
              ? "商品"
              : pendingType.value === "inventory"
                ? "库存"
                : "标签";
          ElMessage.success(`成功${modeText}了 ${res.count} 条${typeText}数据`);
        }
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
    handleCombinedFileChange,
    confirmOverwrite,
    handleUploadWithMode,
  };
}
