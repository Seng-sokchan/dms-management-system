const express = require("express");
const {
  listAllBorrowed,
  listByCustomer,
  upsertCustomerBorrow,
  deleteCustomerBorrow,
} = require("../../../controllers/customerBorrowedMaterialController");
const { requireAuth } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  upsertCustomerBorrowedMaterialSchema,
  customerBorrowParamsSchema,
  customerBorrowMaterialParamsSchema,
} = require("../../../validators/customerBorrowedMaterial.validator");

const router = express.Router();

router.get(
  "/customer-borrowed-materials",
  requireAuth,
  listAllBorrowed,
);
router.get(
  "/customers/:customerId/borrowed-materials",
  requireAuth,
  validate({ params: customerBorrowParamsSchema }),
  listByCustomer,
);
router.post(
  "/customers/:customerId/borrowed-materials",
  requireAuth,
  validate({ params: customerBorrowParamsSchema, body: upsertCustomerBorrowedMaterialSchema }),
  upsertCustomerBorrow,
);
router.delete(
  "/customers/:customerId/borrowed-materials/:materialId",
  requireAuth,
  validate({ params: customerBorrowMaterialParamsSchema }),
  deleteCustomerBorrow,
);

module.exports = router;
