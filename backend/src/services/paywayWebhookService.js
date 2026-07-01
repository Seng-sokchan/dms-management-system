const { getPool } = require("../../database/pool");
const paymentRepository = require("../repositories/payments");
const paywayClient = require("../integrations/payway/paywayClient");
const { normalizePaywayCallback } = require("../integrations/payway/paywayWebhookNormalize");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const paymentStatusCache = require("./paymentStatusCache");

const PAYWAY_SUCCESS_STATUS = new Set([0, "0", "APPROVED", "PAID", "PREAUTH_APPROVED"]);

function isPaywaySuccessStatus(status) {
  if (PAYWAY_SUCCESS_STATUS.has(status)) return true;
  if (typeof status === "string") {
    const upper = status.toUpperCase();
    return PAYWAY_SUCCESS_STATUS.has(upper);
  }
  return false;
}

async function promoteCheckoutToPayment(session, providerTranId, rawCallbackPayload) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const existing = await paymentRepository.getPaymentById(session.id, conn);
    if (existing) {
      await conn.commit();
      return existing;
    }

    const now = new Date();
    const payment = await paymentRepository.insertPayment(
      {
        id: session.id,
        orderId: session.orderId,
        customerId: session.customerId,
        paywayTranId: session.paywayTranId,
        providerTranId: providerTranId || session.paywayTranId,
        amount: session.amount,
        currency: session.currency,
        rawCallbackPayload,
        verifiedAt: now,
        paidAt: now,
      },
      conn,
    );
    await conn.commit();
    await paymentStatusCache.removeCheckoutSession(session.id);
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

  let session =
    (await paymentStatusCache.getCheckoutByPaywayTranId(tranId))
    || (merchantRef ? await paymentStatusCache.getCheckoutSession(merchantRef) : null);

  if (!session) {
    const err = new Error("Payment not found for callback");
    err.code = "PAYMENT_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  if (!isPaywaySuccessStatus(status)) {
    await paymentStatusCache.removeCheckoutSession(session.id);
    return { paymentId: session.id, status: "unpaid", failed: true };
  }

  const checkResult = await paywayClient.checkTransaction(tranId);
  if (!paywayClient.isApprovedCheckResponse(checkResult)) {
    return {
      paymentId: session.id,
      status: "unpaid",
      pendingVerification: true,
    };
  }

  const updated = await promoteCheckoutToPayment(session, tranId, payload);
  await paymentStatusCache.setPaid(updated);
  emitPaymentStatus(updated);
  return { paymentId: updated.id, status: "paid", paid: true };
}

async function reconcileCheckoutSession(session) {
  if (!session?.paywayTranId) return session;
  try {
    const checkResult = await paywayClient.checkTransaction(session.paywayTranId);
    if (paywayClient.isApprovedCheckResponse(checkResult)) {
      const payment = await promoteCheckoutToPayment(session, session.paywayTranId, {
        source: "reconcile",
        checkResult,
      });
      await paymentStatusCache.setPaid(payment);
      return payment;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[payway-reconcile] check failed", session.id, err.message);
  }
  return session;
}

module.exports = {
  processCallback,
  promoteCheckoutToPayment,
  reconcileCheckoutSession,
  reconcilePendingIntent: reconcileCheckoutSession,
};
