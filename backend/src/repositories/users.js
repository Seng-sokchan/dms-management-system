const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapUser } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const { getRoleIdByName } = require("./roleMenus");
const V = require("./sql/readViews");

function resolveExecutor(executor) {
  return executor || getPool();
}

async function listUsers() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.USERS} ORDER BY id DESC`);
  return rows.map(mapUser);
}

async function getUserByUsername(username) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.USERS} WHERE username = ? AND is_active = 1 LIMIT 1`,
    [username],
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: String(row.id),
    name: row.name,
    username: row.username,
    password: row.password_hash,
    role: row.role,
    deliveryAgentId:
      row.delivery_agent_id != null && String(row.delivery_agent_id).trim() !== ""
        ? String(row.delivery_agent_id)
        : "",
  };
}

async function getUserById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.USERS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

async function createUser(payload) {
  const roleId = await getRoleIdByName(payload.role);
  if (!roleId) {
    throw new Error("Role not found");
  }
  const [rowsRaw] = await getPool().query("CALL sp_create_user(?, ?, ?, ?, ?)", [
    payload.name,
    payload.username,
    payload.passwordHash,
    roleId,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getUserById(meta.insertId);
}

async function updateUser(id, payload) {
  let nextRoleId = null;
  let hasUpdates = false;
  if (payload.name !== undefined) {
    hasUpdates = true;
  }
  if (payload.username !== undefined) {
    hasUpdates = true;
  }
  if (payload.role !== undefined) {
    nextRoleId = await getRoleIdByName(payload.role);
    if (!nextRoleId) {
      throw new Error("Role not found");
    }
    hasUpdates = true;
  }
  if (payload.passwordHash !== undefined) {
    hasUpdates = true;
  }
  if (!hasUpdates) return getUserById(id);
  const [rowsRaw] = await getPool().query("CALL sp_update_user(?, ?, ?, ?, ?, ?)", [
    id,
    payload.name !== undefined ? payload.name : null,
    payload.username !== undefined ? payload.username : null,
    payload.role !== undefined ? nextRoleId : null,
    payload.passwordHash !== undefined ? payload.passwordHash : null,
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getUserById(id);
}

async function deactivateUser(id) {
  const [rowsRaw] = await getPool().query("CALL sp_deactivate_user(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

async function setDeliveryAgentUserLink(executor, deliveryAgentId, userId) {
  const db = resolveExecutor(executor);
  const aid =
    deliveryAgentId != null && String(deliveryAgentId).trim() !== "" ? Number(deliveryAgentId) : null;
  const uid = userId != null && String(userId).trim() !== "" ? Number(userId) : null;
  await db.query("CALL sp_set_delivery_agent_user_link(?, ?)", [aid, uid]);
}

module.exports = {
  listUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  setDeliveryAgentUserLink,
};
