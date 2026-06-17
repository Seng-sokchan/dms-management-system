const { getPool } = require("../../database/pool");
const paymentRepository = require("../repositories/payments");
const paymentIntentRepository = require("../repositories/paymentIntents");
const orderRepository = require("../repositories/orders");
const paywayClient = require("../integrations/payway/paywayClient");
const { normalizePaywayCallback } = require("../integrations/payway/paywayWebhookNormalize");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");

const PAYWAY_SUCCESS_STATUS = new Set([0, "0", "APPROVED", "PAID", "PREAUTH_APPROVED"]);

function isPaywaySuccessStatus(status) {
  if (PAYWAY_SUCCESS_STATUS.has(status)) return true;
  if (typeof status === "string") {
    const upper = status.toUpperCase();
    return PAYWAY_SUCCESS_STATUS.has(upper);
  }
  return false;
}

async function promoteIntentToPayment(intent, providerTranId, rawCallbackPayload) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const existing = await paymentRepository.getPaymentById(intent.id, conn);
    if (existing) {
      await conn.commit();
      return existing;
    }

    const now = new Date();
    const payment = await paymentRepository.insertPayment(
      {
        id: intent.id,
        orderId: intent.orderId,
        customerId: intent.customerId,
        paywayTranId: intent.paywayTranId,
        providerTranId: providerTranId || intent.paywayTranId,
        amount: intent.amount,
        currency: intent.currency,
        rawCallbackPayload,
        verifiedAt: now,
        paidAt: now,
      },
      conn,
    );
    await paymentIntentRepository.deleteIntentById(intent.id, conn);
    await conn.commit();
    return payment;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Process PayWay server pushback (callback_url).
 */
async function processCallback(body) {
  const normalized = normalizePaywayCallback(body);
  const tranId = normalized.tranId;
  const status = normalized.status;
  const merchantRef = normalized.merchantRef;
  const payload = normalized.raw || body;

  if (!tranId) {
    const err = new Error("Missing tran_id");
    err.code = "BAD_CALLBACK";
    err.status = 400;
    throw err;
  }

  const existingPaid = await paymentRepository.getPaymentByPaywayTranId(tranId);
  if (existingPaid) {
    return { paymentId: existingPaid.id, status: "paid", duplicate: true };
  }

  let intent =
    (await paymentIntentRepository.getIntentByPaywayTranId(tranId)) ||
    (merchantRef ? await paymentIntentRepository.getIntentById(merchantRef) : null);

  if (!intent) {
    const err = new Error("Payment not found for callback");
    err.code = "PAYMENT_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  if (!isPaywaySuccessStatus(status)) {
    await paymentIntentRepository.deleteIntentById(intent.id);
    return { paymentId: intent.id, status: "unpaid", failed: true };
  }

  const checkResult = await paywayClient.checkTransaction(tranId);
  if (!paywayClient.isApprovedCheckResponse(checkResult)) {
    return {
      paymentId: intent.id,
      status: "pending",
      pendingVerification: true,
    };
  }

  const updated = await promoteIntentToPayment(intent, tranId, payload);
  emitPaymentStatus(updated);
  return { paymentId: updated.id, status: "paid", paid: true };
}

async function reconcilePendingIntent(intent) {
  if (!intent?.paywayTranId) return intent;
  try {
    const checkResult = await paywayClient.checkTransaction(intent.paywayTranId);
    if (paywayClient.isApprovedCheckResponse(checkResult)) {
      return promoteIntentToPayment(intent, intent.paywayTranId, {
        source: "reconcile",
        checkResult,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[payway-reconcile] check failed", intent.id, err.message);
  }
  return intent;
}

module.exports = {
  processCallback,
  promoteIntentToPayment,
  reconcilePendingIntent,
};
