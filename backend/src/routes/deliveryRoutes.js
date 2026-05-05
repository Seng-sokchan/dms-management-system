const express = require("express");
const {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
} = require("../controllers/deliveryController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { deliveryBodySchema, deliveryIdParamsSchema } = require("../validators/delivery.validator");

const router = express.Router();

router.get("/delivery-agents", requireAuth, listDeliveryAgents);
router.post(
  "/delivery-agents",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ body: deliveryBodySchema }),
  createDeliveryAgent,
);
router.post(
  "/delivery-agents/:id",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ params: deliveryIdParamsSchema, body: deliveryBodySchema }),
  updateDeliveryAgent,
);
router.delete(
  "/delivery-agents/:id",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ params: deliveryIdParamsSchema }),
  deleteDeliveryAgent,
);

module.exports = router;
