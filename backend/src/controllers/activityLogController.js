const activityLogService = require("../services/activityLogService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listActivityLogs = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 5000);
  const rows = await activityLogService.listActivityLogs(limit);
  return success(res, rows);
});

module.exports = {
  listActivityLogs,
};
