/**
 * 工作台逻辑 Composable
 */
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { workbenchApi } from "@/api/workbench";
import type { workbenchTrend, workbenchCount } from "@/api/workbench";

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

function formatSigned(num: number): string {
  return num > 0 ? `+${num}` : `${num}`;
}
function typeOfTrend(num: number): "up" | "down" {
  return num >= 0 ? "up" : "down";
}

export function useWorkbench() {
  const loading = ref(false);
  const count = ref<workbenchCount>();
  const trends = ref<workbenchTrend>();
  const statCards = ref<StatCard[]>([]);

  // 加载统计数据
  const loadStats = async () => {
    loading.value = true;
    try {
      const res = await workbenchApi.getWorkbenchStats();
      if (res.countErr) {
        ElMessage.error("加载统计数据失败");
        for (const err of res.errors || []) {
          console.error("获取统计数据错误: ", err);
        }
      }
      if (res.trendErr) {
        ElMessage.error("加载趋势数据失败");
        for (const err of res.errors || []) {
          console.error("获取趋势数据错误: ", err);
        }
      }
      console.log("数据: ", res);
      count.value = res.data.count;
      trends.value = res.data.trend;

      // 构建统计卡片数据
      statCards.value = [
        {
          label: "已合作达人",
          value: count.value?.tatlentCount || 0,
          icon: "User",
          color: "blue",
          trend: {
            value: `较昨日 ${formatSigned(trends.value?.tatlentTrend || 0)}`,
            type: typeOfTrend(trends.value?.tatlentTrend || 0),
          },
        },
        {
          label: "本月累计GMV",
          value: count.value?.gmvTotal || 0,
          icon: "Money",
          color: "green",
          trend: {
            value: `较昨日 ${formatSigned(trends.value?.gmvTrend || 0)}`,
            type: typeOfTrend(trends.value?.gmvTrend || 0),
          },
        },
        {
          label: "进行中执行单",
          value: count.value?.executionOrderCount || 0,
          icon: "Document",
          color: "red",
          trend: {
            value: `较昨日 ${formatSigned(trends.value?.executionOrderTrend || 0)}`,
            type: typeOfTrend(trends.value?.executionOrderTrend || 0),
          },
        },
        {
          label: "有效货组数量",
          value: count.value?.bundleCount || 0,
          icon: "Collection",
          color: "orange",
          trend: {
            value: `较昨日 ${formatSigned(trends.value?.bundleTrend || 0)}`,
            type: typeOfTrend(trends.value?.bundleTrend || 0),
          },
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
    count,
    trends,
    statCards,
    loadStats,
  };
}
