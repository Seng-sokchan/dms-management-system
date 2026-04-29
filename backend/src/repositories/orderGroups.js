const { getPool } = require("../db/pool");
const { unwrapProcedureRows } = require("./unwrap");

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

module.exports = {
  listOrderGroups,
  getOrderGroupById,
};
