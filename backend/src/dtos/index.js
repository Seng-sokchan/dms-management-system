/**
 * Barrel export for DTOs.
 *   const { toUserDto, toOrderDto } = require("../dtos");
 */
module.exports = {
  ...require("./user.dto"),
  ...require("./order.dto"),
};
