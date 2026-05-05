const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapDepot } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listDepots() {
  const [rows] = await getPool().query("CALL sp_list_depots()");
  return unwrapProcedureRows(rows).map(mapDepot);
}

async function getDepotById(id) {
  const [rows] = await getPool().query("CALL sp_get_depot_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapDepot(resultRows[0]) : null;
}

async function getDepotByOwnerUserId(ownerUserId) {
  const [rows] = await getPool().query("CALL sp_get_depot_by_owner_user_id(?)", [ownerUserId]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapDepot(resultRows[0]) : null;
}

async function listDepotsByOwnerUserId(ownerUserId) {
  const [rows] = await getPool().query("CALL sp_list_depots_by_owner_user_id(?)", [ownerUserId]);
  return unwrapProcedureRows(rows).map(mapDepot);
}

async function getDepotByDepotUserId(depotUserId) {
  const [rows] = await getPool().query("CALL sp_get_depot_by_depot_user_id(?)", [depotUserId]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapDepot(resultRows[0]) : null;
}

async function createDepot(payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = (payload.address && String(payload.address).trim()) || "";
  const ownerUserId = Number(payload.ownerUserId);
  const depotUserId = payload.depotUserId ? Number(payload.depotUserId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_create_depot(?, ?, ?, ?, ?, ?)", [
    name,
    phone,
    address,
    ownerUserId,
    depotUserId,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getDepotById(meta.insertId);
}

async function updateDepot(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = (payload.address && String(payload.address).trim()) || "";
  const ownerUserId = Number(payload.ownerUserId);
  const depotUserId = payload.depotUserId ? Number(payload.depotUserId) : null;
  const [rowsRaw] = await getPool().query("CALL sp_update_depot(?, ?, ?, ?, ?, ?, ?)", [
    id,
    name,
    phone,
    address,
    ownerUserId,
    depotUserId,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getDepotById(id);
}

async function deleteDepot(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_depot(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listDepots,
  getDepotById,
  getDepotByOwnerUserId,
  listDepotsByOwnerUserId,
  getDepotByDepotUserId,
  createDepot,
  updateDepot,
  deleteDepot,
};
