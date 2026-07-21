const appSettingsService = require("../services/appSettingsService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const getSpecialDay = asyncHandler(async (_req, res) => {
  const data = await appSettingsService.getSpecialDaySettings();
  return success(res, data);
});

const updateSpecialDay = asyncHandler(async (req, res) => {
  const data = await appSettingsService.setSpecialDayEnabled(req.body.enabled);
  return success(res, data);
});

module.exports = {
  getSpecialDay,
  updateSpecialDay,
};
