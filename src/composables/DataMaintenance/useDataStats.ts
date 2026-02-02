import { ref, onMounted } from "vue";
import { dataApi, backupApi } from "@/api";
/**
 * 数据统计 Composable
 * 负责获取和管理货品数据统计信息
 */
export interface DataStats {
  count: number;
  productLastUpdate: string;
  inventoryLastUpdate: string;
  labelLastUpdate: string;
  lastBackupTime: string;
}

export function useDataStats() {
  const stats = ref<DataStats>({
    count: 0,
    productLastUpdate: "-",
    inventoryLastUpdate: "-",
    labelLastUpdate: "-",
    lastBackupTime: "-",
  });
  // 获取数据统计信息
  const fetchStats = async () => {
    try {
      const res = await dataApi.getStats();
      console.log("API Response:", res);

      let lastBackupTime = "-";
      try {
        const backupRes = await backupApi.getLastBackupTime();
        lastBackupTime = backupRes.lastBackupTime || "-";
      } catch (err) {
        console.error("Failed to fetch backup time:", err);
      }

      stats.value = {
        count: res.count,
        productLastUpdate: res.productLastUpdate || "-",
        inventoryLastUpdate: res.inventoryLastUpdate || "-",
        labelLastUpdate: res.labelLastUpdate || "-",
        lastBackupTime: lastBackupTime,
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
