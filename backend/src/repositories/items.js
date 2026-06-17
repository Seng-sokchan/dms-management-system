const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapItem } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listItems() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.ITEMS} ORDER BY id DESC`);
  return rows.map(mapItem);
}

async function getItemById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.ITEMS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapItem(rows[0]) : null;
}

async function createItem(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_item(?, ?, ?, ?)", [
    payload.catalogId,
    payload.name,
    payload.sku || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getItemById(meta.insertId);
}

async function updateItem(id, payload) {
  const [rowsRaw] = await getPool().query("CALL sp_update_item(?, ?, ?, ?, ?)", [
    id,
    payload.catalogId,
    payload.name,
    payload.sku || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0 ? getItemById(id) : null;
}

async function deleteItem(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_item(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
