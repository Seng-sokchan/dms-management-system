const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapTruck } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

async function listTrucks() {
  const [rows] = await getPool().query("CALL sp_list_trucks()");
  return unwrapProcedureRows(rows).map(mapTruck);
}

async function getTruckById(id) {
  const [rows] = await getPool().query("CALL sp_get_truck_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapTruck(resultRows[0]) : null;
}

async function createTruck(payload) {
  const [result] = await getPool().query(
    "INSERT INTO trucks (code, plate_no, delivery_agent_id, capacity_note, updated_at) VALUES (?, ?, ?, ?, ?)",
    [payload.code, payload.plateNo, payload.deliveryAgentId ? Number(payload.deliveryAgentId) : null, payload.capacityNote || "", nowIso()],
  );
  return getTruckById(result.insertId);
}

async function updateTruck(id, payload) {
  const code = String(payload.code || "").trim();
  const plateNo = String(payload.plateNo || "").trim();
  const capacityNote = (payload.capacityNote && String(payload.capacityNote).trim()) || "";
  const [result] = await getPool().query(
    "UPDATE trucks SET code = ?, plate_no = ?, delivery_agent_id = ?, capacity_note = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [code, plateNo, payload.deliveryAgentId ? Number(payload.deliveryAgentId) : null, capacityNote, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getTruckById(id);
}

async function deleteTruck(id) {
  const [result] = await getPool().query(
    "UPDATE trucks SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
};
