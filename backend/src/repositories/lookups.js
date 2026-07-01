const { getPool } = require("../../database/pool");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listOrderStatuses() {
  const [rows] = await getPool().query("SELECT id, name, sort_order FROM v_statuses ORDER BY sort_order ASC, id ASC");
  return rows.map((row) => ({ id: Number(row.id), name: row.name, sortOrder: Number(row.sort_order) }));
}

async function getStatusIdByName(name, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query("SELECT id FROM v_statuses WHERE name = ? LIMIT 1", [name]);
  return rows[0] ? rows[0].id : null;
}

module.exports = {
  listOrderStatuses,
  getStatusIdByName,
};
