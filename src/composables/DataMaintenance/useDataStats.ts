import { ref, onMounted } from "vue";
/**
 * 数据统计 Composable
 * 负责获取和管理货品数据统计信息
 */
export interface DataStats {
  count: number;
  goodsLastUpdate: string;
  inventoryLastUpdate: string;
  labelLastUpdate: string;
  lastBackupTime: string;
}

export function useDataStats() {
  const stats = ref<DataStats>({
    count: 0,
    goodsLastUpdate: "-",
    inventoryLastUpdate: "-",
    labelLastUpdate: "-",
    lastBackupTime: "-",
  });
  // 获取数据统计信息
  const fetchStats = async () => {
    try {
      const res = await (window as any).electronAPI.getStats();
      const backupRes = await (window as any).electronAPI.getLastBackupTime();
      stats.value = {
        count: res.count,
        goodsLastUpdate: res.goodsLastUpdate || "-",
        inventoryLastUpdate: res.inventoryLastUpdate || "-",
        labelLastUpdate: res.labelLastUpdate || "-",
        lastBackupTime:
          backupRes.success && backupRes.lastBackupTime
            ? backupRes.lastBackupTime
            : "-",
      };
    } catch (e) {
      console.error(e);
    }
  };

  onMounted(fetchStats);

  return {
    stats,
    fetchStats,
  };
}
