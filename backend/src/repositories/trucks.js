const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapTruck } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

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
  const [rowsRaw] = await getPool().query("CALL sp_create_truck(?, ?, ?, ?, ?)", [
    payload.code,
    payload.plateNo,
    payload.deliveryAgentId ? Number(payload.deliveryAgentId) : null,
    payload.capacityNote || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getTruckById(meta.insertId);
}

async function updateTruck(id, payload) {
  const code = String(payload.code || "").trim();
  const plateNo = String(payload.plateNo || "").trim();
  const capacityNote = (payload.capacityNote && String(payload.capacityNote).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_update_truck(?, ?, ?, ?, ?, ?)", [
    id, code, plateNo, payload.deliveryAgentId ? Number(payload.deliveryAgentId) : null, capacityNote, nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getTruckById(id);
}

async function deleteTruck(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_truck(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
};
