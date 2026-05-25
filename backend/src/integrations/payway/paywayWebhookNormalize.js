/**
 * Normalize PayWay pushback (callback) payloads into { tranId, status, apv, merchantRef, raw }.
 */
function normalizePaywayCallback(body) {
  if (!body || typeof body !== "object") {
    return { tranId: "", status: undefined, apv: "", merchantRef: "", raw: body };
  }

  let payload = body;
  if (typeof body.payload === "string") {
    try {
      payload = JSON.parse(body.payload);
    } catch {
      payload = body;
    }
  }

  const tranId = String(
    payload.tran_id || payload.tranId || payload.transaction_id || "",
  ).trim();

  let status = payload.status;
  if (status == null && payload.payment_status != null) {
    status = payload.payment_status;
  }

  const nested = payload.return_params;
  if (status == null && nested && typeof nested === "object") {
    if (nested.payment_status != null) status = nested.payment_status;
    if (status == null && nested.status != null) status = nested.status;
  }

  if (typeof nested === "string" && nested.trim()) {
    try {
      const parsed = JSON.parse(nested);
      if (status == null && parsed?.payment_status != null) status = parsed.payment_status;
      if (status == null && parsed?.status != null) status = parsed.status;
    } catch {
      /* return_params is opaque text */
    }
  }

  const apv = payload.apv != null ? String(payload.apv) : "";
  const merchantRef = String(
    payload.merchant_ref_no || payload.merchant_ref || payload.merchantRef || "",
  ).trim();

  let paymentIdFromReturn = "";
  const returnParams = payload.return_params ?? nested;
  if (returnParams && typeof returnParams === "object" && returnParams.paymentId) {
    paymentIdFromReturn = String(returnParams.paymentId).trim();
  } else if (typeof returnParams === "string" && returnParams.trim()) {
    try {
      const parsed = JSON.parse(returnParams);
      if (parsed?.paymentId) paymentIdFromReturn = String(parsed.paymentId).trim();
    } catch {
      /* not JSON */
    }
  }

  return {
    tranId,
    status,
    apv,
    merchantRef: merchantRef || paymentIdFromReturn,
    raw: payload,
  };
}

module.exports = { normalizePaywayCallback };
