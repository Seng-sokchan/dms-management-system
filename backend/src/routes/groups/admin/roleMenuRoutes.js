const express = require("express");
const { getRoleMenus, saveRoleMenus } = require("../../../controllers/roleMenuController");
const { requireAuth, requireMenuKey } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const { roleMenuBodySchema, roleNameParamsSchema } = require("../../../validators/roleMenu.validator");

const router = express.Router();
const rulesGuard = [requireAuth, requireMenuKey("users")];

router.get("/role-menus", ...rulesGuard, getRoleMenus);
router.post(
  "/role-menus/:roleName",
  ...rulesGuard,
  validate({ params: roleNameParamsSchema, body: roleMenuBodySchema }),
  saveRoleMenus,
);

module.exports = router;
