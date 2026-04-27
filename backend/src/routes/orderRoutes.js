const express = require("express");
const {
  listStatuses,
  listOrders,
  createOrder,
  assignOrder,
  updateOrderStatus,
  confirmDelivery,
  dashboardSummary,
  mobileListOrders,
  mobileUpdateStatus,
} = require("../controllers/orderController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/statuses", requireAuth, listStatuses);
router.get("/orders", requireAuth, listOrders);
router.post("/orders", requireAuth, requireRoles("Admin", "Owner"), createOrder);
// More specific paths before POST /orders/:id
router.post("/orders/:id/delivery-confirmation", requireAuth, requireRoles("Admin", "Logistics", "Delivery"), confirmDelivery);
router.post("/orders/:id/status", requireAuth, requireRoles("Admin", "Owner", "Logistics", "Delivery"), updateOrderStatus);
router.post("/orders/:id", requireAuth, requireRoles("Admin", "Owner"), assignOrder);

router.get("/dashboard/summary", requireAuth, dashboardSummary);

router.get("/mobile/orders", requireAuth, mobileListOrders);
router.post("/mobile/orders/:id/status", requireAuth, mobileUpdateStatus);

module.exports = router;
