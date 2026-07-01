const paymentStatusCache = require("../services/paymentStatusCache");
const paywayWebhookService = require("../services/paywayWebhookService");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");

const POLL_INTERVAL_MS = paymentStatusCache.RECONCILE_INTERVAL_MS;

let timer = null;

async function pollOnce() {
  const paymentIds = await paymentStatusCache.listPendingIds(100);
  for (const paymentId of paymentIds) {
    try {
      const session = await paymentStatusCache.getCheckoutSession(paymentId);
      if (!session) {
        await paymentStatusCache.stopLiveCheck(paymentId);
        continue;
      }

      const reconciled = await paywayWebhookService.reconcileCheckoutSession(session);
      if (reconciled?.status === "paid") {
        await paymentStatusCache.setPaid(reconciled);
        emitPaymentStatus(reconciled);
      } else if (await paymentStatusCache.isLiveCheckActive(paymentId)) {
        await paymentStatusCache.touchLiveCheck(session);
      } else {
        await paymentStatusCache.stopLiveCheck(paymentId);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[payment-poller] reconcile failed", paymentId, err.message);
    }
  }
}

function startPaymentStatusPoller() {
  if (timer) return;

  timer = setInterval(() => {
    void pollOnce().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[payment-poller] tick failed", err.message);
    });
  }, POLL_INTERVAL_MS);

  void pollOnce().catch(() => {});

  // eslint-disable-next-line no-console
  console.log(`Payment live-check poller started (every ${POLL_INTERVAL_MS / 1000}s).`);
}

function stopPaymentStatusPoller() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  startPaymentStatusPoller,
  stopPaymentStatusPoller,
  pollOnce,
};
