const userManagementService = require("../services/userManagementService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listUsers = asyncHandler(async (_req, res) => {
  const users = await userManagementService.listUsers();
  return success(res, users);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userManagementService.createUser(req.body);
  return created(res, user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userManagementService.updateUser(req.user, req.params.id, req.body);
  return success(res, user);
});

const deactivateUser = asyncHandler(async (req, res) => {
  await userManagementService.deactivateUser(req.user, req.params.id);
  return noContent(res);
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await userManagementService.resetUserPassword(req.user, req.params.id);
  return success(res, user);
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
};
