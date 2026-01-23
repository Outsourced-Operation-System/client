import { ref } from "vue";
import { ElMessage } from "element-plus";
import { backupApi } from "@/api";

/**
 * 数据备份 Composable
 * 负责数据备份、恢复和备份列表管理
 */

export interface BackupItem {
  filename: string;
  timestamp: number;
  datetime: string;
}

export function useBackup(onBackupSuccess: () => void) {
  const backupConfirmVisible = ref(false);
  const backupListVisible = ref(false);
  const restoreConfirmVisible = ref(false);
  const deleteBackupConfirmVisible = ref(false);
  const backupList = ref<BackupItem[]>([]);
  const selectedBackup = ref<BackupItem | null>(null);
  // 确认备份
  const confirmBackup = () => {
    backupConfirmVisible.value = true;
  };
  // 执行备份
  const handleBackup = async () => {
    backupConfirmVisible.value = false;
    try {
      const res = await backupApi.backupDatabase();
      if (res.success) {
        ElMessage.success("数据备份成功");
        onBackupSuccess();
      } else {
        ElMessage.error("备份失败");
      }
    } catch (e: any) {
      console.error("备份出错:", e);
      ElMessage.error("备份出错: " + (e?.message || String(e)));
    }
  };
  // 显示备份列表
  const showBackupList = async () => {
    try {
      const res = await backupApi.getBackups();
      if (Array.isArray(res)) {
        backupList.value = res.map((item: any) => ({
          filename: item.filename,
          timestamp: item.timestamp || Date.parse(item.createdAt),
          datetime: item.createdAt,
        }));
        backupListVisible.value = true;
      } else {
        ElMessage.error("获取备份列表失败");
      }
    } catch (e: any) {
      console.error("获取备份列表出错:", e);
      ElMessage.error("获取备份列表出错: " + (e?.message || String(e)));
    }
  };
  // 确认恢复备份
  const confirmRestore = (backup: BackupItem) => {
    selectedBackup.value = backup;
    restoreConfirmVisible.value = true;
  };
  // 执行恢复备份
  const handleRestore = async () => {
    restoreConfirmVisible.value = false;
    if (!selectedBackup.value) return;

    try {
      const res = await backupApi.restoreBackup(
        String(selectedBackup.value.timestamp),
      );
      if (res.success) {
        ElMessage.success("数据恢复成功，已自动备份当前数据");
        onBackupSuccess();
        // 刷新备份列表
        const backupRes = await backupApi.getBackups();
        if (Array.isArray(backupRes)) {
          backupList.value = backupRes.map((item: any) => ({
            filename: item.filename,
            timestamp: item.timestamp || Date.parse(item.createdAt),
            datetime: item.createdAt,
          }));
        }
      } else {
        ElMessage.error("恢复失败");
      }
    } catch (e: any) {
      console.error("恢复出错:", e);
      ElMessage.error("恢复出错: " + (e?.message || String(e)));
    } finally {
      selectedBackup.value = null;
    }
  };
  // 确认删除备份
  const confirmDeleteBackup = (backup: BackupItem) => {
    selectedBackup.value = backup;
    deleteBackupConfirmVisible.value = true;
  };
  // 执行删除备份
  const handleDeleteBackup = async () => {
    deleteBackupConfirmVisible.value = false;
    if (!selectedBackup.value) return;

    try {
      const res = await backupApi.deleteBackup(
        String(selectedBackup.value.timestamp),
      );
      if (res.success) {
        ElMessage.success("备份已删除");
        // 刷新备份列表
        const backupRes = await backupApi.getBackups();
        if (Array.isArray(backupRes)) {
          backupList.value = backupRes.map((item: any) => ({
            filename: item.filename,
            timestamp: item.timestamp || Date.parse(item.createdAt),
            datetime: item.createdAt,
          }));
        }
        onBackupSuccess();
      } else {
        ElMessage.error("删除失败");
      }
    } catch (e: any) {
      console.error("删除备份出错:", e);
      ElMessage.error("删除备份出错: " + (e?.message || String(e)));
    } finally {
      selectedBackup.value = null;
    }
  };

  return {
    backupConfirmVisible,
    backupListVisible,
    restoreConfirmVisible,
    deleteBackupConfirmVisible,
    backupList,
    selectedBackup,
    confirmBackup,
    handleBackup,
    showBackupList,
    confirmRestore,
    handleRestore,
    confirmDeleteBackup,
    handleDeleteBackup,
  };
}
