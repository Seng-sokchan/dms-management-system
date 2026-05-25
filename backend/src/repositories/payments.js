const crypto = require("node:crypto");
const { getPool } = require("../db/pool");

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    provider: row.provider,
    paywayTranId: row.payway_tran_id,
    providerTranId: row.provider_tran_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paymentOption: row.payment_option,
    checkoutUrl: row.checkout_url,
    deeplinkUrl: row.deeplink_url,
    verifiedAt: row.verified_at,
    paidAt: row.paid_at,
    expiresAt: row.expires_at,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertPayment(row, executor) {
  const db = executor || getPool();
  await db.query(
    `INSERT INTO payments (
      id, order_id, customer_id, provider, payway_tran_id, amount, currency, status,
      payment_option, checkout_url, deeplink_url, raw_create_response, expires_at, idempotency_key, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      row.id,
      row.orderId,
      row.customerId,
      row.provider || "payway",
      row.paywayTranId,
      row.amount,
      row.currency,
      row.status || "pending",
      row.paymentOption,
      row.checkoutUrl,
      row.deeplinkUrl,
      row.rawCreateResponse ? JSON.stringify(row.rawCreateResponse) : null,
      row.expiresAt,
      row.idempotencyKey,
    ],
  );
  return getPaymentById(row.id, db);
}

async function getPaymentById(id, executor) {
  const db = executor || getPool();
  const [rows] = await db.query("SELECT * FROM payments WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function getPaymentByPaywayTranId(paywayTranId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    "SELECT * FROM payments WHERE payway_tran_id = ? LIMIT 1",
    [paywayTranId],
  );
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function findPendingPaymentByOrderId(orderId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `SELECT * FROM payments
     WHERE order_id = ? AND status = 'pending' AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [orderId],
  );
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function getLatestPaymentByOrderId(orderId, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    "SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1",
    [orderId],
  );
  return rows[0] ? mapPayment(rows[0]) : null;
}

async function updatePayment(id, patch, executor) {
  const db = executor || getPool();
  const sets = [];
  const vals = [];

  const allowed = {
    status: "status",
    providerTranId: "provider_tran_id",
    checkoutUrl: "checkout_url",
    deeplinkUrl: "deeplink_url",
    rawCreateResponse: "raw_create_response",
    rawCallbackPayload: "raw_callback_payload",
    verifiedAt: "verified_at",
    paidAt: "paid_at",
  };

  for (const [key, col] of Object.entries(allowed)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      let val = patch[key];
      if (key === "rawCreateResponse" || key === "rawCallbackPayload") {
        val = val ? JSON.stringify(val) : null;
      }
      vals.push(val);
    }
  }

  if (sets.length === 0) return getPaymentById(id, db);
  sets.push("updated_at = NOW()");
  vals.push(id);
  await db.query(`UPDATE payments SET ${sets.join(", ")} WHERE id = ?`, vals);
  return getPaymentById(id, db);
}

async function setOrderPaymentStatus(orderId, paymentStatus, executor) {
  const db = executor || getPool();
  await db.query("UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?", [
    paymentStatus,
    orderId,
  ]);
}

function buildWebhookEventKey(tranId, status, apv) {
  const raw = `${tranId}:${String(status ?? "")}:${String(apv ?? "")}`;
  if (raw.length <= 120) return raw;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

async function insertWebhookEvent(row, executor) {
  const db = executor || getPool();
  const paymentId = row.paymentId || null;
  try {
    const [result] = await db.query(
      `INSERT INTO payment_webhook_events (payment_id, event_key, payload, processed, processed_at, error)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        row.eventKey,
        JSON.stringify(row.payload || {}),
        row.processed ? 1 : 0,
        row.processedAt || null,
        row.error || null,
      ],
    );
    return { inserted: true, id: result.insertId };
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return { inserted: false, duplicate: true };
    }
    if (err && err.code === "ER_NO_SUCH_TABLE") {
      const tableErr = new Error(
        "payment_webhook_events table is missing. Run: npm run db:migrate:payway",
      );
      tableErr.code = "WEBHOOK_TABLE_MISSING";
      tableErr.cause = err;
      throw tableErr;
    }
    throw err;
  }
}

async function listWebhookEventsByPaymentId(paymentId, limit = 20, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `SELECT id, payment_id, event_key, processed, processed_at, error, created_at
     FROM payment_webhook_events
     WHERE payment_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    [paymentId, limit],
  );
  return rows;
}

async function markWebhookEventProcessed(eventKey, error, executor) {
  const db = executor || getPool();
  await db.query(
    `UPDATE payment_webhook_events
     SET processed = 1, processed_at = NOW(), error = ?
     WHERE event_key = ?`,
    [error || null, eventKey],
  );
}

async function listStuckPendingPayments(limit = 50, executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `SELECT * FROM payments
     WHERE status = 'pending'
       AND payway_tran_id IS NOT NULL
       AND created_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
  return rows.map(mapPayment);
}

async function expirePendingPayments(executor) {
  const db = executor || getPool();
  const [rows] = await db.query(
    `SELECT id, order_id FROM payments WHERE status = 'pending' AND expires_at <= NOW()`,
  );
  if (!rows.length) return 0;
  await db.query(
    `UPDATE payments SET status = 'expired', updated_at = NOW()
     WHERE status = 'pending' AND expires_at <= NOW()`,
  );
  for (const row of rows) {
    await setOrderPaymentStatus(row.order_id, "unpaid", db);
  }
  return rows.length;
}

module.exports = {
  mapPayment,
  insertPayment,
  getPaymentById,
  getPaymentByPaywayTranId,
  findPendingPaymentByOrderId,
  getLatestPaymentByOrderId,
  updatePayment,
  setOrderPaymentStatus,
  buildWebhookEventKey,
  insertWebhookEvent,
  markWebhookEventProcessed,
  listWebhookEventsByPaymentId,
  listStuckPendingPayments,
  expirePendingPayments,
};
