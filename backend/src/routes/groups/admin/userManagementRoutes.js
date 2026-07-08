const express = require("express");
const {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} = require("../../../controllers/userManagementController");
const { requireAuth, requireRoles } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} = require("../../../validators/userManagement.validator");

const router = express.Router();
const requireAdminPanel = requireRoles("Admin", "Owner");

router.get("/users", requireAuth, requireAdminPanel, listUsers);
router.post(
  "/users",
  requireAuth,
  requireAdminPanel,
  validate({ body: createUserSchema }),
  createUser,
);
router.post(
  "/users/:id",
  requireAuth,
  requireAdminPanel,
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  updateUser,
);
router.delete(
  "/users/:id",
  requireAuth,
  requireAdminPanel,
  validate({ params: userIdParamsSchema }),
  deactivateUser,
);

module.exports = router;
