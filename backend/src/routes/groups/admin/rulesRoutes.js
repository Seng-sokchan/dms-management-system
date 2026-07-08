const express = require("express");
const { listRoles } = require("../../../controllers/rulesController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");

const router = express.Router();
const rulesGuard = [requireAuth, requireRoles("Admin", "Owner")];

router.get("/roles", ...rulesGuard, listRoles);

module.exports = router;
