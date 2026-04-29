/**
 * @deprecated This file is a legacy compatibility shim.
 *
 * Import auth middleware directly from its new home:
 *   const { auth, createToken } = require("./middleware/auth");
 *
 * This shim will be removed in a future cleanup pass.
 */
module.exports = require("./middleware/auth");
