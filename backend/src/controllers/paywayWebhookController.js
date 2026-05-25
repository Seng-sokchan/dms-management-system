const paywayWebhookService = require("../services/paywayWebhookService");

async function handlePaywayCallback(req, res) {
  try {
    // eslint-disable-next-line no-console
    console.log("[payway-webhook] received", {
      tran_id: req.body?.tran_id || req.body?.tranId,
      status: req.body?.status,
      contentType: req.headers["content-type"],
    });
    const result = await paywayWebhookService.processCallback(req.body);
    // eslint-disable-next-line no-console
    console.log("[payway-webhook] processed", result);
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    if (err.code === "INVALID_SIGNATURE") {
      return res.status(401).json({ received: false, error: "invalid_signature" });
    }
    if (err.code === "PAYMENT_NOT_FOUND") {
      return res.status(200).json({ received: true, ignored: true, logged: true });
    }
    if (err.code === "WEBHOOK_TABLE_MISSING") {
      return res.status(503).json({ received: false, error: err.message });
    }
    if (err.status === 400) {
      return res.status(400).json({ received: false, error: err.message });
    }
    // eslint-disable-next-line no-console
    console.error("[payway-webhook]", err);
    return res.status(500).json({ received: false, error: "processing_failed" });
  }
}

module.exports = { handlePaywayCallback };
