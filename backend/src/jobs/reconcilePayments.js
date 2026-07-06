/**
 * Reconcile stuck PayWay checkout sessions stored in Redis.
 * Run via: node src/jobs/reconcilePayments.js
 */
require("dotenv").config({ override: true });
const paymentStatusCache = require("../services/paymentStatusCache");
const paywayWebhookService = require("../services/paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");

async function run() {
  const paymentIds = await paymentStatusCache.listPendingIds(100);
  for (const paymentId of paymentIds) {
    const session = await paymentStatusCache.getCheckoutSession(paymentId);
    if (!session) {
      await paymentStatusCache.stopLiveCheck(paymentId);
      continue;
    }
    if (paymentStatusCache.isSessionExpired(session)) {
      await paymentStatusCache.expireCheckoutSession(paymentId);
      continue;
    }
    const updated = await paywayWebhookService.reconcileCheckoutSession(session);
    if (updated?.status === "paid") {
      emitPaymentStatus(updated);
      // eslint-disable-next-line no-console
      console.log(`[reconcile] marked paid ${updated.id}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[reconcile] processed ${paymentIds.length} Redis checkout session(s)`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[reconcile] failed", err.message);
    process.exit(1);
  });
