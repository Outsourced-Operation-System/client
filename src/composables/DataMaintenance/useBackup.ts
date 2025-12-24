import { ref } from "vue";
import { ElMessage } from "element-plus";

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

  const confirmBackup = () => {
    backupConfirmVisible.value = true;
  };

  const handleBackup = async () => {
    backupConfirmVisible.value = false;
    try {
      const res = await (window as any).electronAPI.backupDatabase();
      if (res.success) {
        ElMessage.success("数据备份成功");
        onBackupSuccess();
      } else {
        ElMessage.error("备份失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("备份出错:", e);
      ElMessage.error("备份出错: " + (e?.message || String(e)));
    }
  };

  const showBackupList = async () => {
    try {
      const res = await (window as any).electronAPI.getBackups();
      if (res.success) {
        backupList.value = res.backups;
        backupListVisible.value = true;
      } else {
        ElMessage.error("获取备份列表失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("获取备份列表出错:", e);
      ElMessage.error("获取备份列表出错: " + (e?.message || String(e)));
    }
  };

  const confirmRestore = (backup: BackupItem) => {
    selectedBackup.value = backup;
    restoreConfirmVisible.value = true;
  };

  const handleRestore = async () => {
    restoreConfirmVisible.value = false;
    if (!selectedBackup.value) return;

    try {
      const res = await (window as any).electronAPI.restoreBackup(
        selectedBackup.value.timestamp
      );
      if (res.success) {
        ElMessage.success("数据恢复成功，已自动备份当前数据");
        onBackupSuccess();
        // 刷新备份列表
        const backupRes = await (window as any).electronAPI.getBackups();
        if (backupRes.success) {
          backupList.value = backupRes.backups;
        }
      } else {
        ElMessage.error("恢复失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      console.error("恢复出错:", e);
      ElMessage.error("恢复出错: " + (e?.message || String(e)));
    } finally {
      selectedBackup.value = null;
    }
  };

  const confirmDeleteBackup = (backup: BackupItem) => {
    selectedBackup.value = backup;
    deleteBackupConfirmVisible.value = true;
  };

  const handleDeleteBackup = async () => {
    deleteBackupConfirmVisible.value = false;
    if (!selectedBackup.value) return;

    try {
      const res = await (window as any).electronAPI.deleteBackup(
        selectedBackup.value.timestamp
      );
      if (res.success) {
        ElMessage.success("备份已删除");
        // 刷新备份列表
        const backupRes = await (window as any).electronAPI.getBackups();
        if (backupRes.success) {
          backupList.value = backupRes.backups;
        }
        onBackupSuccess();
      } else {
        ElMessage.error("删除失败: " + (res.error || "未知错误"));
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
