const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapDelivery } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

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
  const [result] = await getPool().query(
    "INSERT INTO delivery_agents (name, phone, vehicle_type, updated_at) VALUES (?, ?, ?, ?)",
    [payload.name, payload.phone, payload.vehicleType, nowIso()],
  );
  return getDeliveryAgentById(result.insertId);
}

async function updateDeliveryAgent(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const vehicleType = String(payload.vehicleType || "").trim();
  const [result] = await getPool().query(
    "UPDATE delivery_agents SET name = ?, phone = ?, vehicle_type = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [name, phone, vehicleType, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getDeliveryAgentById(id);
}

async function deleteDeliveryAgent(id) {
  const [result] = await getPool().query(
    "UPDATE delivery_agents SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
