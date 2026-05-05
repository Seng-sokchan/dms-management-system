const authService = require("../services/authService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const login = asyncHandler(async (req, res) => {
  const payload = await authService.login(req.body);
  return success(res, payload);
});

const me = asyncHandler(async (req, res) => {
  const payload = await authService.me(req.user);
  return success(res, payload);
});

module.exports = {
  login,
  me,
};
