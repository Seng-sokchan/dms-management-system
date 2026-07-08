const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapDepot } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listDepots() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.DEPOTS} ORDER BY id DESC`);
  return rows.map(mapDepot);
}

async function getDepotById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.DEPOTS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapDepot(rows[0]) : null;
}

async function getDepotByDepotUserId(depotUserId) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.DEPOTS} WHERE depot_user_id = ? LIMIT 1`,
    [depotUserId],
  );
  return rows[0] ? mapDepot(rows[0]) : null;
}

async function createDepot(payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = (payload.address && String(payload.address).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_create_depot(?, ?, ?, ?)", [
    name,
    phone,
    address,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getDepotById(meta.insertId);
}

async function updateDepot(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = (payload.phone && String(payload.phone).trim()) || "";
  const address = (payload.address && String(payload.address).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_update_depot(?, ?, ?, ?, ?)", [
    id,
    name,
    phone,
    address,
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
  getDepotByDepotUserId,
  createDepot,
  updateDepot,
  deleteDepot,
};
