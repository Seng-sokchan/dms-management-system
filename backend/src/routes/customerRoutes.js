const express = require("express");
const {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
} = require("../validators/customer.validator");

const router = express.Router();

router.get("/customers", requireAuth, listCustomers);
router.get("/customer-users", requireAuth, requireRoles("Admin", "Owner"), listCustomerUsers);
router.post(
  "/customers",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ body: createCustomerSchema }),
  createCustomer,
);
router.post(
  "/customers/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: customerIdParamsSchema, body: updateCustomerSchema }),
  updateCustomer,
);
router.delete(
  "/customers/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: customerIdParamsSchema }),
  deleteCustomer,
);

module.exports = router;
