const roleMenuService = require("../services/roleMenuService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const getRoleMenus = asyncHandler(async (_req, res) => {
  const data = await roleMenuService.getRoleMenus();
  return success(res, data);
});

const saveRoleMenus = asyncHandler(async (req, res) => {
  const payload = await roleMenuService.saveRoleMenus(req.params.roleName, req.body.menuKeys);
  return success(res, payload);
});

module.exports = {
  getRoleMenus,
  saveRoleMenus,
};
