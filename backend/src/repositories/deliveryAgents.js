const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapDelivery } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listDeliveryAgents() {
  const [rows] = await getPool().query("CALL sp_list_delivery_agents()");
  return unwrapProcedureRows(rows).map(mapDelivery);
}

async function getDeliveryAgentById(id) {
  const [rows] = await getPool().query("CALL sp_get_delivery_agent_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapDelivery(resultRows[0]) : null;
}

async function createDeliveryAgent(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_delivery_agent(?, ?, ?, ?)", [
    payload.name, payload.phone, payload.vehicleType, nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getDeliveryAgentById(meta.insertId);
}

async function updateDeliveryAgent(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const vehicleType = String(payload.vehicleType || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_update_delivery_agent(?, ?, ?, ?, ?)", [
    id, name, phone, vehicleType, nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getDeliveryAgentById(id);
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
