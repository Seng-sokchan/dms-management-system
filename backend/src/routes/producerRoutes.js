const express = require("express");
const { listProducers, createProducer, updateProducer, deleteProducer } = require("../controllers/producerController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/producers", requireAuth, listProducers);
router.post("/producers", requireAuth, requireRoles("Admin", "Owner"), createProducer);
router.post("/producers/:id", requireAuth, requireRoles("Admin", "Owner"), updateProducer);
router.delete("/producers/:id", requireAuth, requireRoles("Admin", "Owner"), deleteProducer);

module.exports = router;
