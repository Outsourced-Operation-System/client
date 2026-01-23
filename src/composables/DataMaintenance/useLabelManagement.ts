import { ref } from "vue";
import { ElMessage } from "element-plus";
import { labelApi } from "@/api";

export interface Label {
  id: number;
  value: string;
  updatedAt: string;
}

export interface Labels {
  category: Label[];
  productType: Label[];
  bySku: Label[];
  fragrance: Label[];
}

/**
 * 标签管理 Composable
 * 负责标签的获取、添加和删除
 */
export function useLabelManagement() {
  const labelManagementVisible = ref(false);
  const labels = ref<Labels>({
    category: [],
    productType: [],
    bySku: [],
    fragrance: [],
  });

  // 获取所有标签
  const fetchLabels = async () => {
    try {
      const res = await labelApi.getAllLabels();
      // 转换数据格式
      const transformLabels = (data: Record<string, string[]>): Labels => {
        const result: Labels = {
          category: [],
          productType: [],
          bySku: [],
          fragrance: [],
        };
        Object.entries(data).forEach(([field, values]) => {
          const key = field as keyof Labels;
          if (key in result && Array.isArray(values)) {
            result[key] = values.map((value, index) => ({
              id: index,
              value,
              updatedAt: "",
            }));
          }
        });
        return result;
      };
      labels.value = transformLabels(res);
    } catch (e: any) {
      console.error("获取标签出错:", e);
      ElMessage.error("获取标签出错: " + (e?.message || String(e)));
    }
  };

  // 显示标签管理对话框
  const showLabelManagement = async () => {
    await fetchLabels();
    labelManagementVisible.value = true;
  };

  // 添加标签
  const handleAddLabel = async (field: string, value: string) => {
    try {
      const res = await labelApi.addLabel(field, value);
      if (res.success) {
        ElMessage.success("标签添加成功");
        await fetchLabels();
      } else {
        if (res.exists) {
          ElMessage.warning("该标签已存在");
        } else {
          console.error("添加标签失败:", res.error);
          ElMessage.error("添加标签失败: " + (res.error || "未知错误"));
        }
      }
    } catch (e: any) {
      console.error("添加标签出错:", e);
      ElMessage.error("添加标签出错: " + (e?.message || String(e)));
    }
  };

  // 删除标签
  const handleDeleteLabel = async (field: string, labelId: number) => {
    try {
      // 先找到要删除的标签值
      const labelList = labels.value[field as keyof Labels];
      const label = labelList.find((l) => l.id === labelId);
      if (!label) {
        ElMessage.error("标签不存在");
        return;
      }

      const res = await labelApi.deleteLabel(field, label.value);
      if (res.success) {
        ElMessage.success(`成功删除标签，影响 ${res.affectedRows} 条记录`);
        await fetchLabels();
      } else {
        console.error("删除标签失败:", res.error);
        ElMessage.error("删除标签失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("删除标签出错:", e);
      ElMessage.error("删除标签出错: " + (e?.message || String(e)));
    }
  };

  return {
    labelManagementVisible,
    labels,
    fetchLabels,
    showLabelManagement,
    handleAddLabel,
    handleDeleteLabel,
  };
}
