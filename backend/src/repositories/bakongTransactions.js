const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

function mapRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    paymentId: row.payment_id != null ? String(row.payment_id) : null,
    md5: row.md5,
    status: row.status,
    message: row.message || "",
    amount: row.amount != null ? Number(row.amount) : null,
    externalRef: row.external_ref || null,
    rawPayload: row.raw_payload || "",
  };
}

async function getBakongTransactionByMd5(md5) {
  try {
    const [rowsRaw] = await getPool().query("CALL sp_get_bakong_transaction_by_md5(?)", [md5]);
    const rows = unwrapProcedureRows(rowsRaw);
    return mapRow(rows[0]);
  } catch (error) {
    if (error?.code !== "ER_SP_DOES_NOT_EXIST") throw error;
    const [rows] = await getPool().query(
      `SELECT id, order_id, payment_id, md5, status, message, amount, external_ref, raw_payload
       FROM bakong_transactions
       WHERE md5 = ?
       LIMIT 1`,
      [md5],
    );
    return mapRow(rows[0]);
  }
}

async function createBakongTransaction(payload) {
  const params = [
    Number(payload.orderId),
    payload.paymentId ? Number(payload.paymentId) : null,
    payload.md5,
    payload.status || "",
    payload.message || "",
    payload.hash || null,
    payload.fromAccountId || null,
    payload.toAccountId || null,
    payload.currency || null,
    payload.amount != null ? Number(payload.amount) : null,
    payload.description || null,
    payload.createdDateMs != null ? Number(payload.createdDateMs) : null,
    payload.acknowledgedDateMs != null ? Number(payload.acknowledgedDateMs) : null,
    payload.trackingStatus || null,
    payload.receiverBank || null,
    payload.receiverBankAccount || null,
    payload.instructionRef || null,
    payload.externalRef || null,
    JSON.stringify(payload.rawPayload || {}),
    nowIso(),
  ];

  try {
    const [createRowsRaw] = await getPool().query(
      "CALL sp_create_bakong_transaction(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      params,
    );
    const meta = getProcedureMeta(createRowsRaw);
    const [rowsRaw] = await getPool().query("CALL sp_get_bakong_transaction_by_id(?)", [meta.insertId]);
    const rows = unwrapProcedureRows(rowsRaw);
    return mapRow(rows[0]);
  } catch (error) {
    if (error?.code !== "ER_SP_DOES_NOT_EXIST") throw error;
    const [result] = await getPool().query(
      `INSERT INTO bakong_transactions (
        order_id, payment_id, md5, status, message, tx_hash, from_account_id, to_account_id,
        currency, amount, description_text, created_date_ms, acknowledged_date_ms, tracking_status,
        receiver_bank, receiver_bank_account, instruction_ref, external_ref, raw_payload, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params,
    );
    const [rows] = await getPool().query(
      `SELECT id, order_id, payment_id, md5, status, message, amount, external_ref, raw_payload
       FROM bakong_transactions
       WHERE id = ?`,
      [result.insertId],
    );
    return mapRow(rows[0]);
  }
}

async function updateBakongTransactionPaymentIdByMd5(md5, paymentId) {
  try {
    await getPool().query("CALL sp_update_bakong_transaction_payment_id_by_md5(?, ?, ?)", [
      Number(paymentId), nowIso(), String(md5),
    ]);
  } catch (error) {
    if (error?.code !== "ER_SP_DOES_NOT_EXIST") throw error;
    await getPool().query(
      "UPDATE bakong_transactions SET payment_id = ?, updated_at = ? WHERE md5 = ?",
      [Number(paymentId), nowIso(), String(md5)],
    );
  }
}

module.exports = {
  getBakongTransactionByMd5,
  createBakongTransaction,
  updateBakongTransactionPaymentIdByMd5,
};
