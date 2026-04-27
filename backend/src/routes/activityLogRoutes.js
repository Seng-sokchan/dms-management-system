const express = require("express");
const { listActivityLogs } = require("../controllers/activityLogController");
const { requireAuth, requireRoles, requireMenuKey } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/activity-logs",
  requireAuth,
  requireRoles("Admin"),
  requireMenuKey("activityLogs"),
  listActivityLogs,
);

module.exports = router;
