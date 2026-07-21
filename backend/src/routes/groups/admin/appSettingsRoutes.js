const express = require("express");
const {
  getSpecialDay,
  updateSpecialDay,
} = require("../../../controllers/appSettingsController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const { updateSpecialDaySchema } = require("../../../validators/appSettings.validator");

const router = express.Router();
const requireAdminPanel = requireRoles("Admin", "Owner");

router.get("/app-settings/special-day", requireAuth, getSpecialDay);
router.put(
  "/app-settings/special-day",
  requireAuth,
  requireAdminPanel,
  validate({ body: updateSpecialDaySchema }),
  updateSpecialDay,
);

module.exports = router;
