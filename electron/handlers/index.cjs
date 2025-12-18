const { registerProductHandlers } = require("./productHandlers.cjs");
const { registerBundleHandlers } = require("./bundleHandlers.cjs");
const { registerDataHandlers } = require("./dataHandlers.cjs");
const { registerStatsHandlers } = require("./statsHandlers.cjs");

/**
 * 注册所有 IPC handlers
 */
function registerAllHandlers() {
  registerProductHandlers();
  registerBundleHandlers();
  registerDataHandlers();
  registerStatsHandlers();
}

module.exports = {
  registerAllHandlers,
};
