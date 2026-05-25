/**
 * Reconcile stuck pending PayWay payments and expire old intents.
 * Run via: node src/jobs/reconcilePayments.js
 */
const { loadEnv } = require("../config/env");
const { checkDbConnection } = require("../db/pool");
const paymentRepository = require("../repositories/payments");
const paywayWebhookService = require("../services/paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");

loadEnv();

async function run() {
  await checkDbConnection();

  const expired = await paymentRepository.expirePendingPayments();
  // eslint-disable-next-line no-console
  console.log(`[reconcile] expired ${expired} pending payment(s)`);

  const stuck = await paymentRepository.listStuckPendingPayments(50);
  for (const payment of stuck) {
    if (payment.status !== "pending") continue;
    const updated = await paywayWebhookService.reconcilePendingPayment(payment);
    if (updated?.status === "paid") {
      emitPaymentStatus(updated);
      // eslint-disable-next-line no-console
      console.log(`[reconcile] marked paid ${updated.id}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[reconcile] processed ${stuck.length} pending row(s)`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[reconcile] failed", err);
    process.exit(1);
  });
