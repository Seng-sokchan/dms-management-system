const { getPool } = require("../db/pool");
const paymentRepository = require("../repositories/payments");
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

async function recordWebhookEvent({ paymentId, tranId, status, apv, payload, processed, error }) {
  const eventKey = paymentRepository.buildWebhookEventKey(tranId, status, apv);
  try {
    return await paymentRepository.insertWebhookEvent({
      paymentId: paymentId || null,
      eventKey,
      payload,
      processed: Boolean(processed),
      processedAt: processed ? new Date() : null,
      error: error || null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[payway-webhook] payment_webhook_events insert failed", {
      code: err.code,
      message: err.message,
      paymentId,
      eventKey,
    });
    throw err;
  }
}

/**
 * Process PayWay server pushback (callback_url). Never trust return deeplink alone.
 */
async function processCallback(body) {
  const normalized = normalizePaywayCallback(body);
  const tranId = normalized.tranId;
  const apv = normalized.apv;
  const status = normalized.status;
  const merchantRef = normalized.merchantRef;
  const payload = normalized.raw || body;

  if (!tranId) {
    const err = new Error("Missing tran_id");
    err.code = "BAD_CALLBACK";
    err.status = 400;
    throw err;
  }

  let payment = await paymentRepository.getPaymentByPaywayTranId(tranId);
  if (!payment && merchantRef) {
    payment = await paymentRepository.getPaymentById(merchantRef);
  }

  const webhookInsert = await recordWebhookEvent({
    paymentId: payment?.id,
    tranId,
    status,
    apv,
    payload,
    processed: false,
  });

  if (!payment) {
    await paymentRepository.markWebhookEventProcessed(
      paymentRepository.buildWebhookEventKey(tranId, status, apv),
      "payment_not_found",
    );
    const err = new Error("Payment not found for callback");
    err.code = "PAYMENT_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  if (webhookInsert.duplicate) {
    payment = await paymentRepository.getPaymentById(payment.id);
    if (payment.status === "paid") {
      return { paymentId: payment.id, status: payment.status, duplicate: true };
    }
  }

  const eventKey = paymentRepository.buildWebhookEventKey(tranId, status, apv);

  await paymentRepository.updatePayment(payment.id, {
    providerTranId: tranId,
    rawCallbackPayload: payload,
  });

  if (!isPaywaySuccessStatus(status)) {
    const updated = await finalizeFailed(payment.id, payment.orderId);
    await paymentRepository.markWebhookEventProcessed(eventKey, null);
    emitPaymentStatus(updated);
    return { paymentId: updated.id, status: updated.status, failed: true };
  }

  const checkResult = await paywayClient.checkTransaction(tranId);
  if (!paywayClient.isApprovedCheckResponse(checkResult)) {
    await paymentRepository.markWebhookEventProcessed(
      eventKey,
      "Check transaction did not confirm APPROVED",
    );
    return {
      paymentId: payment.id,
      status: payment.status,
      pendingVerification: true,
    };
  }

  const updated = await finalizePaid(payment.id, payment.orderId, tranId);
  await paymentRepository.markWebhookEventProcessed(eventKey, null);
  emitPaymentStatus(updated);
  return { paymentId: updated.id, status: updated.status, paid: true };
}

async function finalizePaid(paymentId, orderId, providerTranId) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const now = new Date();
    await paymentRepository.updatePayment(
      paymentId,
      {
        status: "paid",
        providerTranId,
        verifiedAt: now,
        paidAt: now,
      },
      conn,
    );
    await paymentRepository.setOrderPaymentStatus(orderId, "paid", conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return paymentRepository.getPaymentById(paymentId);
}

async function finalizeFailed(paymentId, orderId) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await paymentRepository.updatePayment(paymentId, { status: "failed" }, conn);
    await paymentRepository.setOrderPaymentStatus(orderId, "failed", conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return paymentRepository.getPaymentById(paymentId);
}

/**
 * Reconcile stuck pending payments via Check Transaction API.
 */
async function reconcilePendingPayment(payment) {
  if (!payment?.paywayTranId) return payment;
  try {
    const checkResult = await paywayClient.checkTransaction(payment.paywayTranId);
    if (paywayClient.isApprovedCheckResponse(checkResult)) {
      await recordWebhookEvent({
        paymentId: payment.id,
        tranId: payment.paywayTranId,
        status: "reconcile",
        apv: "",
        payload: { source: "reconcile", checkResult },
        processed: true,
      });
      return finalizePaid(payment.id, payment.orderId, payment.paywayTranId);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[payway-reconcile] check failed", payment.id, err.message);
  }
  return payment;
}

module.exports = {
  processCallback,
  finalizePaid,
  finalizeFailed,
  reconcilePendingPayment,
};
