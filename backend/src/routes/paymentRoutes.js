const express = require("express");
const { listPayments, listPaymentMethods, createPayment } = require("../controllers/paymentController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/payments", requireAuth, listPayments);
router.get("/payment-methods", requireAuth, listPaymentMethods);
router.post("/payments", requireAuth, requireRoles("Admin", "Owner"), createPayment);

module.exports = router;
