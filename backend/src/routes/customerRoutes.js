const express = require("express");
const {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
} = require("../validators/customer.validator");

const router = express.Router();

router.get("/customers", requireAuth, listCustomers);
router.get(
  "/customer-users",
  requireAuth,
  listCustomerUsers,
);
router.post(
  "/customers",
  requireAuth,
  validate({ body: createCustomerSchema }),
  createCustomer,
);
router.post(
  "/customers/:id",
  requireAuth,
  validate({ params: customerIdParamsSchema, body: updateCustomerSchema }),
  updateCustomer,
);
router.delete(
  "/customers/:id",
  requireAuth,
  validate({ params: customerIdParamsSchema }),
  deleteCustomer,
);

module.exports = router;
