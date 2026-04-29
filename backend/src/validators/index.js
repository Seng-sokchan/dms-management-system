/**
 * Barrel export for validators.
 *   const { validate, loginSchema } = require("../validators");
 */
module.exports = {
  ...require("./validate"),
  ...require("./auth.validator"),
  ...require("./order.validator"),
  ...require("./customer.validator"),
};
