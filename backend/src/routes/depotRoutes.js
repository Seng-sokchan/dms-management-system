const express = require("express");
const {
  listDepots,
  getDepotById,
  createDepot,
  updateDepot,
  deleteDepot,
} = require("../controllers/depotController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createDepotSchema,
  updateDepotSchema,
  depotIdParamsSchema,
} = require("../validators/depot.validator");

const router = express.Router();

router.get("/depots", requireAuth, requireRoles("Admin", "Owner", "Depot"), listDepots);
router.get("/depots/:id", requireAuth, requireRoles("Admin", "Owner", "Depot"), validate({ params: depotIdParamsSchema }), getDepotById);
router.post(
  "/depots",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ body: createDepotSchema }),
  createDepot,
);
router.post(
  "/depots/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: depotIdParamsSchema, body: updateDepotSchema }),
  updateDepot,
);
router.delete(
  "/depots/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: depotIdParamsSchema }),
  deleteDepot,
);

module.exports = router;
