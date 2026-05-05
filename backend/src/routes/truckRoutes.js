const express = require("express");
const {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
} = require("../controllers/truckController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { truckBodySchema, truckIdParamsSchema } = require("../validators/truck.validator");

const router = express.Router();

router.get("/trucks", requireAuth, listTrucks);
router.post(
  "/trucks",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ body: truckBodySchema }),
  createTruck,
);
router.post(
  "/trucks/:id",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ params: truckIdParamsSchema, body: truckBodySchema }),
  updateTruck,
);
router.delete(
  "/trucks/:id",
  requireAuth,
  requireRoles("Admin", "Logistics"),
  validate({ params: truckIdParamsSchema }),
  deleteTruck,
);

module.exports = router;
