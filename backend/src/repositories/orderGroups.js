const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listOrderGroups() {
  const [rowsRaw] = await getPool().query("CALL sp_list_order_groups()");
  const rows = unwrapProcedureRows(rowsRaw);
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

async function getOrderGroupById(id) {
  const [rowsRaw] = await getPool().query("CALL sp_get_order_group_by_id(?)", [id]);
  const rows = unwrapProcedureRows(rowsRaw);
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    name: rows[0].name,
  };
}

async function createOrderGroup(payload) {
  const name = String(payload?.name || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_create_order_group(?, ?)", [name, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return getOrderGroupById(meta.insertId);
}

async function updateOrderGroup(id, payload) {
  const name = String(payload?.name || "").trim();
  const [rowsRaw] = await getPool().query("CALL sp_update_order_group(?, ?, ?)", [id, name, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getOrderGroupById(id);
}

async function deleteOrderGroup(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_order_group(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listOrderGroups,
  getOrderGroupById,
  createOrderGroup,
  updateOrderGroup,
  deleteOrderGroup,
};
