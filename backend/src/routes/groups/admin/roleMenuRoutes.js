const express = require("express");
const { getRoleMenus, saveRoleMenus } = require("../../../controllers/roleMenuController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const { roleMenuBodySchema, roleNameParamsSchema } = require("../../../validators/roleMenu.validator");

const router = express.Router();

router.get("/role-menus", requireAuth, requireRoles("Admin"), getRoleMenus);
router.post(
  "/role-menus/:roleName",
  requireAuth,
  requireRoles("Admin"),
  validate({ params: roleNameParamsSchema, body: roleMenuBodySchema }),
  saveRoleMenus,
);

module.exports = router;
