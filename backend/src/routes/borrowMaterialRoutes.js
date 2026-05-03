const express = require("express");
const {
  listBorrowMaterials,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
} = require("../controllers/borrowMaterialController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createBorrowMaterialSchema,
  updateBorrowMaterialSchema,
  borrowMaterialIdParamsSchema,
} = require("../validators/borrowMaterial.validator");

const router = express.Router();

router.get(
  "/borrow-materials",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  listBorrowMaterials,
);
router.post(
  "/borrow-materials",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ body: createBorrowMaterialSchema }),
  createBorrowMaterial,
);
router.post(
  "/borrow-materials/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: borrowMaterialIdParamsSchema, body: updateBorrowMaterialSchema }),
  updateBorrowMaterial,
);
router.delete(
  "/borrow-materials/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: borrowMaterialIdParamsSchema }),
  deleteBorrowMaterial,
);

module.exports = router;
