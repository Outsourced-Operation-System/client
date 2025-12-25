const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  importData: (type, filePath, mode) =>
    ipcRenderer.invoke("db:import-data", type, filePath, mode),
  searchProducts: (
    query,
    page,
    pageSize,
    sortProp,
    sortOrder,
    filterZeroStock
    // filterNoInfo
  ) =>
    ipcRenderer.invoke(
      "db:search-products",
      query,
      page,
      pageSize,
      sortProp,
      sortOrder,
      filterZeroStock
      // filterNoInfo
    ),
  searchProductSuggestions: (query) =>
    ipcRenderer.invoke("db:search-product-suggestions", query),
  searchProductsByTypes: (query, searchTypes, filterZeroStock) =>
    ipcRenderer.invoke(
      "db:search-products-by-types",
      query,
      searchTypes,
      filterZeroStock
    ),
  getArticleStockTotal: (articleCode) =>
    ipcRenderer.invoke("db:get-article-stock-total", articleCode),
  getTodayBundleCount: () => ipcRenderer.invoke("db:get-today-bundle-count"),
  createBundle: (bundleData) =>
    ipcRenderer.invoke("db:create-bundle", bundleData),
  getBundles: (filters) => ipcRenderer.invoke("db:get-bundles", filters),
  getBundleDetail: (id) => ipcRenderer.invoke("db:get-bundle-detail", id),
  deleteBundle: (id) => ipcRenderer.invoke("db:delete-bundle", id),
  batchDeleteBundles: (ids) =>
    ipcRenderer.invoke("db:batch-delete-bundles", ids),
  exportBundle: (id) => ipcRenderer.invoke("db:export-bundle", id),
  batchExportBundles: (ids) =>
    ipcRenderer.invoke("db:batch-export-bundles", ids),
  updateBundleStatus: (id, status) =>
    ipcRenderer.invoke("db:update-bundle-status", id, status),
  updateBundle: (bundleData) =>
    ipcRenderer.invoke("db:update-bundle", bundleData),
  getStats: () => ipcRenderer.invoke("db:get-stats"),
  exportBundles: () => ipcRenderer.invoke("db:export-bundles"),
  exportProducts: () => ipcRenderer.invoke("db:export-products"),
  exportGoods: () => ipcRenderer.invoke("db:export-goods"),
  exportInventory: () => ipcRenderer.invoke("db:export-inventory"),
  clearGoods: () => ipcRenderer.invoke("db:clear-goods"),
  clearInventory: () => ipcRenderer.invoke("db:clear-inventory"),
  // 备份相关
  backupDatabase: () => ipcRenderer.invoke("db:backup-database"),
  getBackups: () => ipcRenderer.invoke("db:get-backups"),
  restoreBackup: (timestamp) =>
    ipcRenderer.invoke("db:restore-backup", timestamp),
  deleteBackup: (timestamp) =>
    ipcRenderer.invoke("db:delete-backup", timestamp),
  getLastBackupTime: () => ipcRenderer.invoke("db:get-last-backup-time"),
  // 标签相关
  searchLabels: (field, keyword) =>
    ipcRenderer.invoke("db:search-labels", field, keyword),
  getLabelValues: (field) => ipcRenderer.invoke("db:get-label-values", field),
});
