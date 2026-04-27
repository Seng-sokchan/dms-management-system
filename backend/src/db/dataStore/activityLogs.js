const { getPool } = require("../pool");

async function listUserActivityLogs(limit = 300) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
  const [rows] = await getPool().query(
    `SELECT id, user_id, username, role, method, path, status_code, message, created_at
     FROM user_activity_logs
     ORDER BY id DESC
     LIMIT ?`,
    [safeLimit],
  );
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
  await getPool().query(
    `INSERT INTO user_activity_logs
     (user_id, username, role, method, path, status_code, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.userId ? Number(payload.userId) : null,
      payload.username || null,
      payload.role || null,
      payload.method,
      payload.path,
      Number(payload.statusCode),
      payload.message || "",
    ],
  );
}

module.exports = {
  listUserActivityLogs,
  createUserActivityLog,
};
