const express = require("express");
const {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
} = require("../controllers/deliveryController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/delivery-agents", requireAuth, listDeliveryAgents);
router.post("/delivery-agents", requireAuth, requireRoles("Admin", "Logistics"), createDeliveryAgent);
router.post("/delivery-agents/:id", requireAuth, requireRoles("Admin", "Logistics"), updateDeliveryAgent);
router.delete("/delivery-agents/:id", requireAuth, requireRoles("Admin", "Logistics"), deleteDeliveryAgent);

module.exports = router;
