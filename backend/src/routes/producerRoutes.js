const express = require("express");
const {
  listProducers,
  createProducer,
  updateProducer,
  deleteProducer,
} = require("../controllers/producerController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { producerBodySchema, producerIdParamsSchema } = require("../validators/producer.validator");

const router = express.Router();

router.get("/producers", requireAuth, listProducers);
router.post(
  "/producers",
  requireAuth,
  validate({ body: producerBodySchema }),
  createProducer,
);
router.post(
  "/producers/:id",
  requireAuth,
  validate({ params: producerIdParamsSchema, body: producerBodySchema }),
  updateProducer,
);
router.delete(
  "/producers/:id",
  requireAuth,
  validate({ params: producerIdParamsSchema }),
  deleteProducer,
);

module.exports = router;
