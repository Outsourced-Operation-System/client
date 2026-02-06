// Electron API 全局类型声明
export interface ElectronAPI {
  getPathForFile: (file: File) => string;
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  saveFile: (
    filePath: string,
    buffer: ArrayBuffer,
  ) => Promise<{ success: boolean; error?: string }>;
  loginSuccess: () => void;
  logout: () => void;
  minimizeWindow: () => void;
}

export interface ElectronUpdater {
  checkForUpdates: () => void;
  onUpdateStatus: (
    callback: (data: { event: string; data: any }) => void,
  ) => void;
  removeUpdateStatusListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electron?: ElectronUpdater;
  }
}
