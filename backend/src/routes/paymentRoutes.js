const express = require("express");
const {
  listPayments,
  listPaymentMethods,
  createPayment,
  generatePaymentKhqr,
  checkPaymentKhqrByMd5List,
  confirmPaymentKhqrTransaction,
  getBakongTokenStatus,
  saveBakongToken,
} = require("../controllers/paymentController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/payments", requireAuth, listPayments);
router.get("/payment-methods", requireAuth, listPaymentMethods);
router.get("/payments/bakong-token", requireAuth, requireRoles("Admin", "Owner"), getBakongTokenStatus);
router.post("/payments/bakong-token", requireAuth, requireRoles("Admin", "Owner"), saveBakongToken);
router.post("/payments/khqr", requireAuth, requireRoles("Admin", "Owner", "Customer"), generatePaymentKhqr);
router.post("/payments/khqr/check-md5-list", requireAuth, requireRoles("Admin", "Owner", "Customer"), checkPaymentKhqrByMd5List);
router.post("/payments/khqr/confirm-transaction", requireAuth, requireRoles("Admin", "Owner", "Customer"), confirmPaymentKhqrTransaction);
router.post("/payments", requireAuth, requireRoles("Admin", "Owner"), createPayment);

module.exports = router;
