const express = require("express");
const {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
} = require("../controllers/truckController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/trucks", requireAuth, listTrucks);
router.post("/trucks", requireAuth, requireRoles("Admin", "Logistics"), createTruck);
router.post("/trucks/:id", requireAuth, requireRoles("Admin", "Logistics"), updateTruck);
router.delete("/trucks/:id", requireAuth, requireRoles("Admin", "Logistics"), deleteTruck);

module.exports = router;
