const express = require("express");
const {
  listDepots,
  getDepotById,
  createDepot,
  updateDepot,
  deleteDepot,
} = require("../../../controllers/depotController");
const { requireAuth } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  createDepotSchema,
  updateDepotSchema,
  depotIdParamsSchema,
} = require("../../../validators/depot.validator");

const router = express.Router();

router.get("/depots", requireAuth, listDepots);
router.get(
  "/depots/:id",
  requireAuth,
  validate({ params: depotIdParamsSchema }),
  getDepotById,
);
router.post(
  "/depots",
  requireAuth,
  validate({ body: createDepotSchema }),
  createDepot,
);
router.post(
  "/depots/:id",
  requireAuth,
  validate({ params: depotIdParamsSchema, body: updateDepotSchema }),
  updateDepot,
);
router.delete(
  "/depots/:id",
  requireAuth,
  validate({ params: depotIdParamsSchema }),
  deleteDepot,
);

module.exports = router;
