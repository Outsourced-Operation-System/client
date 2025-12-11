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
  createBundle: (bundleData) =>
    ipcRenderer.invoke("db:create-bundle", bundleData),
  getBundles: (filters) => ipcRenderer.invoke("db:get-bundles", filters),
  deleteBundle: (id) => ipcRenderer.invoke("db:delete-bundle", id),
  getStats: () => ipcRenderer.invoke("db:get-stats"),
  exportBundles: () => ipcRenderer.invoke("db:export-bundles"),
  exportProducts: () => ipcRenderer.invoke("db:export-products"),
  exportGoods: () => ipcRenderer.invoke("db:export-goods"),
  exportInventory: () => ipcRenderer.invoke("db:export-inventory"),
  clearGoods: () => ipcRenderer.invoke("db:clear-goods"),
  clearInventory: () => ipcRenderer.invoke("db:clear-inventory"),
});
