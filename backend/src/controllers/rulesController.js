const rulesService = require("../services/rulesService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listRoles = asyncHandler(async (_req, res) => {
  const data = await rulesService.getRoles();
  return success(res, data);
});

const listMenus = asyncHandler(async (req, res) => {
  const client = typeof req.query.client === "string" ? req.query.client : undefined;
  const data = await rulesService.getMenus({ client });
  return success(res, data);
});

const getStatusTransitions = asyncHandler(async (_req, res) => {
  const data = await rulesService.getStatusTransitions();
  return success(res, data);
});

const getRoleAccess = asyncHandler(async (_req, res) => {
  const data = await rulesService.getRoleAccess();
  return success(res, data);
});

const saveRoleAccess = asyncHandler(async (req, res) => {
  const data = await rulesService.saveRoleAccess(req.params.roleName, req.body);
  return success(res, data);
});

const getRoleStatusPermissions = asyncHandler(async (_req, res) => {
  const data = await rulesService.getRoleStatusPermissions();
  return success(res, data);
});

const saveRoleStatusPermissions = asyncHandler(async (req, res) => {
  const data = await rulesService.saveRoleStatusPermissions(req.body.matrix);
  return success(res, data);
});

const saveStatusTransitions = asyncHandler(async (req, res) => {
  const data = await rulesService.saveStatusTransitions(req.body.transitions);
  return success(res, data);
});

module.exports = {
  listRoles,
  listMenus,
  getStatusTransitions,
  getRoleAccess,
  saveRoleAccess,
  getRoleStatusPermissions,
  saveRoleStatusPermissions,
  saveStatusTransitions,
};
