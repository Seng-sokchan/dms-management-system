const express = require("express");
const rateLimit = require("express-rate-limit");
const { handlePaywayCallback } = require("../controllers/paywayWebhookController");
const { paywayWebhookParser } = require("../middleware/paywayWebhookParser");

const router = express.Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.PAYWAY_WEBHOOK_RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
});

// Probe-friendly GET (browsers / uptime checks). Real PayWay pushbacks are POST only.
router.get("/webhooks/payway", (_req, res) => {
  res.status(200).json({ ok: true });
});

router.post("/webhooks/payway", ...paywayWebhookParser, webhookLimiter, handlePaywayCallback);

module.exports = router;
