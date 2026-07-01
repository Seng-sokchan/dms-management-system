const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listTransitionsMap() {
  const [rows] = await getPool().query(
    `SELECT from_status, to_status FROM ${V.STATUS_TRANSITIONS} ORDER BY from_status_id ASC, to_status_id ASC`,
  );
  const map = {};
  for (const row of rows) {
    if (!map[row.from_status]) map[row.from_status] = [];
    map[row.from_status].push(row.to_status);
  }
  return map;
}

async function replaceTransitions(transitions) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("CALL sp_delete_all_status_transitions()");
    for (const entry of transitions) {
      const fromStatus = entry.fromStatus;
      const toStatuses = Array.isArray(entry.toStatuses) ? entry.toStatuses : [];
      for (const toStatus of toStatuses) {
        const [fromRows] = await conn.query(`SELECT id FROM ${V.STATUSES} WHERE name = ? LIMIT 1`, [fromStatus]);
        const [toRows] = await conn.query(`SELECT id FROM ${V.STATUSES} WHERE name = ? LIMIT 1`, [toStatus]);
        if (!fromRows[0] || !toRows[0]) {
          throw new Error(`Invalid status transition: ${fromStatus} -> ${toStatus}`);
        }
        await conn.query("CALL sp_add_status_transition(?, ?)", [fromRows[0].id, toRows[0].id]);
      }
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return listTransitionsMap();
}

module.exports = {
  listTransitionsMap,
  replaceTransitions,
};
