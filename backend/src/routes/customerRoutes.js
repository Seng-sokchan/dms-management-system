const express = require("express");
const {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/customers", requireAuth, listCustomers);
router.get("/customer-users", requireAuth, requireRoles("Admin", "Owner"), listCustomerUsers);
router.post("/customers", requireAuth, requireRoles("Admin", "Owner"), createCustomer);
router.post("/customers/:id", requireAuth, requireRoles("Admin", "Owner"), updateCustomer);
router.delete("/customers/:id", requireAuth, requireRoles("Admin", "Owner"), deleteCustomer);

module.exports = router;
