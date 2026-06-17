/**
 * Reconcile stuck pending PayWay intents and expire old rows.
 * Run via: node src/jobs/reconcilePayments.js
 */
const { loadEnv } = require("../config/env");
const { checkDbConnection } = require("../../database/pool");
const paymentIntentRepository = require("../repositories/paymentIntents");
const paywayWebhookService = require("../services/paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");

loadEnv();

async function run() {
  await checkDbConnection();

  await paymentIntentRepository.expirePendingIntents();
  // eslint-disable-next-line no-console
  console.log("[reconcile] expired stale payment intent(s)");

  const stuck = await paymentIntentRepository.listStuckPendingIntents(50);
  for (const intent of stuck) {
    const updated = await paywayWebhookService.reconcilePendingIntent(intent);
    if (updated?.status === "paid") {
      emitPaymentStatus(updated);
      // eslint-disable-next-line no-console
      console.log(`[reconcile] marked paid ${updated.id}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[reconcile] processed ${stuck.length} pending intent row(s)`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[reconcile] failed", err);
    process.exit(1);
  });
