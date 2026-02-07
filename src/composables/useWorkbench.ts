/**
 * 工作台逻辑 Composable
 */
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getDataStats } from "@/api/stats";
import type { DataStats } from "@/api/stats";

export interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: "blue" | "green" | "orange" | "red";
  trend?: {
    value: string;
    type: "up" | "down";
  };
}

export function useWorkbench() {
  const loading = ref(false);
  const stats = ref<DataStats | null>(null);
  const statCards = ref<StatCard[]>([]);

  // 加载统计数据
  const loadStats = async () => {
    loading.value = true;
    try {
      const data = await getDataStats();
      console.log(data);
      stats.value = data;

      // 构建统计卡片数据
      statCards.value = [
        {
          label: "商品总数",
          value: data.count || 0,
          icon: "Box",
          color: "blue",
          trend: { value: "较昨日 +12", type: "up" },
        },
        {
          label: "库存总量",
          value: data.inventoryCount || 0,
          icon: "Files",
          color: "green",
          trend: { value: "较昨日 -5", type: "down" },
        },
        {
          label: "货组数量",
          value: data.bundleCount || 0,
          icon: "Collection",
          color: "orange",
          trend: { value: "较昨日 +3", type: "up" },
        },
        {
          label: "执行单",
          value: data.executionOrderCount || 0,
          icon: "Document",
          color: "red",
        },
      ];
    } catch (error) {
      console.error("加载统计数据失败:", error);
      ElMessage.error("加载统计数据失败");
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadStats();
  });

  return {
    loading,
    stats,
    statCards,
    loadStats,
  };
}
