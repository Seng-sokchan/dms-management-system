/**
 * Barrel export for all constants.
 * Lets callers do:
 *   const { ORDER_STATUS, ROLES } = require("../constants");
 */
module.exports = {
  ...require("./general"),
  ...require("./roleMenus"),
};
