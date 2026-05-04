const { getPool } = require("../db/pool");
const { unwrapProcedureRows } = require("./unwrap");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listOrderStatuses() {
  const [rows] = await getPool().query("CALL sp_list_statuses()");
  return unwrapProcedureRows(rows).map((row) => ({ id: Number(row.id), name: row.name }));
}

async function getStatusIdByName(name, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query("CALL sp_get_status_id_by_name(?)", [name]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? resultRows[0].id : null;
}

module.exports = {
  listOrderStatuses,
  getStatusIdByName,
};
