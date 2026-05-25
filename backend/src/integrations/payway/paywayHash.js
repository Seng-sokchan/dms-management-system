const { createHmac } = require("node:crypto");

/** Base64 HMAC-SHA512 per ABA PayWay docs. */
function createPaywayHash(values, apiKey) {
  const message = values.map((v) => String(v ?? "")).join("");
  return createHmac("sha512", apiKey).update(message).digest("base64");
}

/** Purchase API hash field order (PayWay v2 sandbox PDF). */
function hashForPurchase(fields, apiKey) {
  const sequence = [
    fields.req_time,
    fields.merchant_id,
    fields.tran_id,
    fields.amount,
    fields.items,
    fields.shipping,
    fields.ctid,
    fields.pwt,
    fields.firstname,
    fields.lastname,
    fields.email,
    fields.phone,
    fields.type,
    fields.payment_option,
    fields.return_url,
    fields.cancel_url,
    fields.continue_success_url,
    fields.return_deeplink,
    fields.currency,
    fields.custom_fields,
    fields.return_params,
  ];
  return createPaywayHash(sequence, apiKey);
}

/** Check transaction: req_time + merchant_id + tran_id */
function hashForCheckTransaction(reqTime, merchantId, tranId, apiKey) {
  return createPaywayHash([reqTime, merchantId, tranId], apiKey);
}

module.exports = {
  createPaywayHash,
  hashForPurchase,
  hashForCheckTransaction,
};
