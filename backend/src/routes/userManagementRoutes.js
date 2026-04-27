const express = require("express");
const {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} = require("../controllers/userManagementController");
const { requireAuth, requireRoles, requireMenuKey } = require("../middleware/auth");

const router = express.Router();

router.get("/users", requireAuth, requireRoles("Admin"), requireMenuKey("users"), listUsers);
router.post("/users", requireAuth, requireRoles("Admin"), requireMenuKey("users"), createUser);
router.post("/users/:id", requireAuth, requireRoles("Admin"), requireMenuKey("users"), updateUser);
router.delete("/users/:id", requireAuth, requireRoles("Admin"), requireMenuKey("users"), deactivateUser);

module.exports = router;
