/**
 * 备份相关 API
 */
import { get, post, del } from "./request";

export interface BackupInfo {
  timestamp: string;
  filename: string;
  size: number;
  createdAt: string;
}

export const backupApi = {
  /**
   * 备份数据库
   */
  backupDatabase: (): Promise<{ success: boolean; timestamp?: string }> => {
    return post("/backup");
  },

  /**
   * 获取备份列表
   */
  getBackups: (): Promise<BackupInfo[]> => {
    return get("/backup");
  },

  /**
   * 恢复备份
   */
  restoreBackup: (timestamp: string): Promise<{ success: boolean }> => {
    return post(`/backup/restore/${timestamp}`);
  },

  /**
   * 删除备份
   */
  deleteBackup: (timestamp: string): Promise<{ success: boolean }> => {
    return del(`/backup/${timestamp}`);
  },

  /**
   * 获取最后备份时间
   */
  getLastBackupTime: (): Promise<{ lastBackupTime: string | null }> => {
    return get("/backup/last-time");
  },
};
