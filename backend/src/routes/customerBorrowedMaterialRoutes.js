const express = require("express");
const {
  listAllBorrowed,
  listByCustomer,
  upsertCustomerBorrow,
  deleteCustomerBorrow,
} = require("../controllers/customerBorrowedMaterialController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  upsertCustomerBorrowedMaterialSchema,
  customerBorrowParamsSchema,
  customerBorrowMaterialParamsSchema,
} = require("../validators/customerBorrowedMaterial.validator");

const router = express.Router();

router.get(
  "/customer-borrowed-materials",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  listAllBorrowed,
);
router.get(
  "/customers/:customerId/borrowed-materials",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowParamsSchema }),
  listByCustomer,
);
router.post(
  "/customers/:customerId/borrowed-materials",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowParamsSchema, body: upsertCustomerBorrowedMaterialSchema }),
  upsertCustomerBorrow,
);
router.delete(
  "/customers/:customerId/borrowed-materials/:materialId",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: customerBorrowMaterialParamsSchema }),
  deleteCustomerBorrow,
);

module.exports = router;
