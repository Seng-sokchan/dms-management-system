const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapDelivery } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listDeliveryAgents() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.DELIVERY_AGENTS} ORDER BY id DESC`);
  return rows.map(mapDelivery);
}

async function getDeliveryAgentById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.DELIVERY_AGENTS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapDelivery(rows[0]) : null;
}

async function createDeliveryAgent(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_delivery_agent(?, ?, ?, ?)", [
    payload.name,
    payload.phone,
    payload.vehicleType,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getDeliveryAgentById(meta.insertId);
}

async function updateDeliveryAgent(id, payload) {
  const [rowsRaw] = await getPool().query("CALL sp_update_delivery_agent(?, ?, ?, ?, ?)", [
    id,
    payload.name,
    payload.phone,
    payload.vehicleType,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0 ? getDeliveryAgentById(id) : null;
}

async function deleteDeliveryAgent(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_delivery_agent(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
