const express = require("express");
const {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} = require("../../../controllers/userManagementController");
const { requireAuth, requireMenuKey, requireManageMenuKey } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} = require("../../../validators/userManagement.validator");

const router = express.Router();

router.get("/users", requireAuth, requireMenuKey("users"), listUsers);
router.post(
  "/users",
  requireAuth,
  requireManageMenuKey("users"),
  validate({ body: createUserSchema }),
  createUser,
);
router.post(
  "/users/:id",
  requireAuth,
  requireManageMenuKey("users"),
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  updateUser,
);
router.delete(
  "/users/:id",
  requireAuth,
  requireManageMenuKey("users"),
  validate({ params: userIdParamsSchema }),
  deactivateUser,
);

module.exports = router;
