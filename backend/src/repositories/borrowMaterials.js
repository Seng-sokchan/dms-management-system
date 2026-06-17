const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapBorrowMaterial } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listBorrowMaterials() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.BORROW_MATERIALS} ORDER BY id DESC`);
  return rows.map(mapBorrowMaterial);
}

async function getBorrowMaterialById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.BORROW_MATERIALS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapBorrowMaterial(rows[0]) : null;
}

async function createBorrowMaterial(payload) {
  const name = String(payload.name || "").trim();
  const unit = (payload.unit && String(payload.unit).trim()) || "";
  const note = (payload.note && String(payload.note).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_create_borrow_material(?, ?, ?, ?)", [
    name,
    unit,
    note,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getBorrowMaterialById(meta.insertId);
}

async function updateBorrowMaterial(id, payload) {
  const name = String(payload.name || "").trim();
  const unit = (payload.unit && String(payload.unit).trim()) || "";
  const note = (payload.note && String(payload.note).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_update_borrow_material(?, ?, ?, ?, ?)", [
    id,
    name,
    unit,
    note,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getBorrowMaterialById(id);
}

async function deleteBorrowMaterial(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_borrow_material(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listBorrowMaterials,
  getBorrowMaterialById,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
};
