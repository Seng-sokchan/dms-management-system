const express = require("express");
const {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
} = require("../controllers/truckController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { truckBodySchema, truckIdParamsSchema } = require("../validators/truck.validator");

const router = express.Router();

router.get("/trucks", requireAuth, listTrucks);
router.post(
  "/trucks",
  requireAuth,
  validate({ body: truckBodySchema }),
  createTruck,
);
router.post(
  "/trucks/:id",
  requireAuth,
  validate({ params: truckIdParamsSchema, body: truckBodySchema }),
  updateTruck,
);
router.delete(
  "/trucks/:id",
  requireAuth,
  validate({ params: truckIdParamsSchema }),
  deleteTruck,
);

module.exports = router;
