const rulesService = require("../services/rulesService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listRoles = asyncHandler(async (_req, res) => {
  const data = await rulesService.getRoles();
  return success(res, data);
});

module.exports = {
  listRoles,
};
