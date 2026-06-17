const { getPool } = require("../../database/pool");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listOrderStatuses() {
  const [rows] = await getPool().query("SELECT id, name FROM v_statuses ORDER BY id DESC");
  return rows.map((row) => ({ id: Number(row.id), name: row.name }));
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
