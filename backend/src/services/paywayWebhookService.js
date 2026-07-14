const { getPool } = require("../../database/pool");
const paymentRepository = require("../repositories/payments");
const paywayClient = require("../integrations/payway/paywayClient");
const { normalizePaywayCallback } = require("../integrations/payway/paywayWebhookNormalize");
const { emitPaymentStatus } = require("../socket/paymentStatusSocket");
const paymentStatusCache = require("./paymentStatusCache");

/** PayWay pushback uses `status: 0` for approved (not `payment_status`). */
function isPaywayPushbackSuccess(payload) {
  if (!payload || typeof payload !== "object") return false;
  const status = payload.status;
  if (status === 0 || status === "0") return true;
  const paymentStatus = payload.payment_status ?? payload.data?.payment_status;
  return String(paymentStatus || "").toUpperCase() === "APPROVED";
}

/** Check-transaction response must report payment_status APPROVED before insert. */
function hasApprovedPaymentStatus(body) {
  if (!body || typeof body !== "object") return false;
  const paymentStatus = body.payment_status ?? body.data?.payment_status;
  return String(paymentStatus || "").toUpperCase() === "APPROVED";
}

function pickDefined(entries) {
  const out = {};
  for (const [key, value] of entries) {
    if (value == null || value === "") continue;
    out[key] = value;
  }
  return out;
}

function firstScalar(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    if (typeof value === "object") continue;
    return value;
  }
  return undefined;
}

/** Slim check-transaction fields for payments.raw_callback_payload. */
function compactCheckResult(checkResult, pushback) {
  if (!checkResult || typeof checkResult !== "object") return null;
  const data = checkResult.data && typeof checkResult.data === "object"
    ? checkResult.data
    : checkResult;

  const paymentStatus = String(
    firstScalar(data.payment_status, checkResult.payment_status) || "APPROVED",
  ).toUpperCase();
  const amount = firstScalar(
    data.amount,
    checkResult.amount,
    data.original_amount,
    data.total_amount,
    data.payment_amount,
  );
  const totalAmount = firstScalar(
    data.totalAmount,
    data.total_amount,
    checkResult.totalAmount,
    amount,
  );
  const description = firstScalar(data.description, checkResult.description)
    || (paymentStatus === "APPROVED" ? "approved" : undefined);
  const status = firstScalar(
    typeof data.status === "number" || typeof data.status === "string" ? data.status : undefined,
    typeof checkResult.status === "number" || typeof checkResult.status === "string"
      ? checkResult.status
      : undefined,
    data.payment_status_code,
    pushback?.status,
    paymentStatus === "APPROVED" ? 0 : undefined,
  );

  return pickDefined([
    ["status", status === "00" ? 0 : status],
    ["description", description],
    ["amount", amount != null ? Number(amount) : undefined],
    ["totalAmount", totalAmount != null ? Number(totalAmount) : undefined],
    ["apv", firstScalar(data.apv, checkResult.apv, pushback?.apv)],
    ["payment_status", paymentStatus],
    [
      "datetime",
      firstScalar(
        data.datetime,
        data.transaction_date,
        checkResult.datetime,
        checkResult.transaction_date,
      ),
    ],
  ]);
}

/** Keep only audit fields — avoid storing full PayWay envelopes. */
function compactCallbackPayload({ source, pushback, checkResult }) {
  const slimCheck = compactCheckResult(checkResult, pushback);
  return {
    source: source || "callback",
    ...(slimCheck ? { checkResult: slimCheck } : {}),
  };
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
 * Process PayWay server pushback (`return_url`).
 */
async function processCallback(body) {
  const normalized = normalizePaywayCallback(body);
  const tranId = normalized.tranId;
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

  if (!isPaywayPushbackSuccess(payload)) {
    await paymentStatusCache.removeCheckoutSession(session.id);
    return { paymentId: session.id, status: "unpaid", failed: true };
  }

  const checkResult = await paywayClient.checkTransaction(tranId);
  if (!hasApprovedPaymentStatus(checkResult)) {
    return {
      paymentId: session.id,
      status: "unpaid",
      pendingVerification: true,
    };
  }

  const updated = await promoteCheckoutToPayment(
    session,
    tranId,
    compactCallbackPayload({ source: "callback", pushback: payload, checkResult }),
  );
  await paymentStatusCache.setPaid(updated);
  emitPaymentStatus(updated);
  return { paymentId: updated.id, status: "paid", paid: true };
}

async function reconcileCheckoutSession(session) {
  if (!session?.paywayTranId) return session;
  try {
    const checkResult = await paywayClient.checkTransaction(session.paywayTranId);
    if (!hasApprovedPaymentStatus(checkResult)) {
      return session;
    }
    const payment = await promoteCheckoutToPayment(
      session,
      session.paywayTranId,
      compactCallbackPayload({ source: "reconcile", checkResult }),
    );
    await paymentStatusCache.setPaid(payment);
    return payment;
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
