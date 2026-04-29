const { getPool } = require("../db/pool");

async function listUserActivityLogs(limit = 300) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100000);
  const [rowsRaw] = await getPool().query("CALL sp_list_user_activity_logs(?)", [safeLimit]);
  const rows = Array.isArray(rowsRaw?.[0]) ? rowsRaw[0] : rowsRaw;
  return rows.map((row) => ({
    id: String(row.id),
    userId: row.user_id != null ? String(row.user_id) : null,
    username: row.username || null,
    role: row.role || null,
    method: row.method,
    path: row.path,
    statusCode: Number(row.status_code),
    message: row.message || "",
    createdAt: row.created_at,
  }));
}

async function createUserActivityLog(payload) {
  await getPool().query("CALL sp_create_user_activity_log(?, ?, ?, ?, ?, ?, ?)", [
    payload.userId ? Number(payload.userId) : null,
    payload.username || null,
    payload.role || null,
    payload.method,
    payload.path,
    Number(payload.statusCode),
    payload.message || "",
  ]);
}

module.exports = {
  listUserActivityLogs,
  createUserActivityLog,
};
