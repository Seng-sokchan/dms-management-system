const express = require("express");
const {
  listRoles,
  listMenus,
  getStatusTransitions,
  saveStatusTransitions,
  getRoleAccess,
  saveRoleAccess,
  getRoleStatusPermissions,
  saveRoleStatusPermissions,
} = require("../../../controllers/rulesController");
const { requireAuth, requireMenuKey } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  statusTransitionsBodySchema,
  roleNameParamsSchema,
  roleAccessBodySchema,
  roleStatusPermissionsBodySchema,
} = require("../../../validators/rules.validator");

const router = express.Router();
const rulesGuard = [requireAuth, requireMenuKey("users")];

router.get("/roles", ...rulesGuard, listRoles);
router.get("/menus", ...rulesGuard, listMenus);
router.get("/status-transitions", ...rulesGuard, getStatusTransitions);
router.get("/role-access", ...rulesGuard, getRoleAccess);
router.get("/role-status-permissions", ...rulesGuard, getRoleStatusPermissions);
router.put(
  "/status-transitions",
  ...rulesGuard,
  validate({ body: statusTransitionsBodySchema }),
  saveStatusTransitions,
);
router.put(
  "/roles/:roleName/access",
  ...rulesGuard,
  validate({ params: roleNameParamsSchema, body: roleAccessBodySchema }),
  saveRoleAccess,
);
router.put(
  "/role-status-permissions",
  ...rulesGuard,
  validate({ body: roleStatusPermissionsBodySchema }),
  saveRoleStatusPermissions,
);

module.exports = router;
