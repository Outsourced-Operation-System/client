const { registerProductHandlers } = require("./productHandlers.cjs");
const { registerBundleHandlers } = require("./bundleHandlers.cjs");
const { registerDataHandlers } = require("./dataHandlers.cjs");
const { registerStatsHandlers } = require("./statsHandlers.cjs");

function registerAllHandlers() {
  registerProductHandlers();
  registerBundleHandlers();
  registerDataHandlers();
  registerStatsHandlers();
}

module.exports = {
  registerAllHandlers,
};
