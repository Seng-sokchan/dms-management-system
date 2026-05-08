const express = require("express");
const {
  listBorrowMaterials,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
} = require("../controllers/borrowMaterialController");
const { requireAuth } = require("../middleware/auth");
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
  listBorrowMaterials,
);
router.post(
  "/borrow-materials",
  requireAuth,
  validate({ body: createBorrowMaterialSchema }),
  createBorrowMaterial,
);
router.post(
  "/borrow-materials/:id",
  requireAuth,
  validate({ params: borrowMaterialIdParamsSchema, body: updateBorrowMaterialSchema }),
  updateBorrowMaterial,
);
router.delete(
  "/borrow-materials/:id",
  requireAuth,
  validate({ params: borrowMaterialIdParamsSchema }),
  deleteBorrowMaterial,
);

module.exports = router;
