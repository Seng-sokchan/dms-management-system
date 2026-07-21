const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function getSetting(key, executor) {
  const db = resolveExecutor(executor);
  const [rows] = await db.query(
    "SELECT setting_key, setting_value, updated_at FROM app_settings WHERE setting_key = ? LIMIT 1",
    [String(key)],
  );
  return rows[0] || null;
}

async function setSetting(key, value, executor) {
  const db = resolveExecutor(executor);
  const ts = nowIso();
  await db.query(
    `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)`,
    [String(key), String(value), ts],
  );
  return getSetting(key, executor);
}

module.exports = {
  getSetting,
  setSetting,
};
