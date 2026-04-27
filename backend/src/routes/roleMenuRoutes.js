const express = require("express");
const { getRoleMenus, saveRoleMenus } = require("../controllers/roleMenuController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/role-menus", requireAuth, requireRoles("Admin"), getRoleMenus);
router.post("/role-menus/:roleName", requireAuth, requireRoles("Admin"), saveRoleMenus);

module.exports = router;
