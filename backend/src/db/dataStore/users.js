const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapUser } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const { getRoleIdByName } = require("./roleMenus");

async function listUsers() {
  const [rows] = await getPool().query("CALL sp_list_users()");
  return unwrapProcedureRows(rows).map(mapUser);
}

async function getUserByUsername(username) {
  const [rows] = await getPool().query("CALL sp_get_user_by_username(?)", [username]);
  const resultRows = unwrapProcedureRows(rows);
  if (!resultRows[0]) return null;
  return {
    id: String(resultRows[0].id),
    name: resultRows[0].name,
    username: resultRows[0].username,
    password: resultRows[0].password_hash,
    role: resultRows[0].role,
  };
}

async function getUserById(id) {
  const [rows] = await getPool().query("CALL sp_get_user_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapUser(resultRows[0]) : null;
}

async function createUser(payload) {
  const roleId = await getRoleIdByName(payload.role);
  if (!roleId) {
    throw new Error("Role not found");
  }
  const [rowsRaw] = await getPool().query("CALL sp_create_user(?, ?, ?, ?, ?)", [
    payload.name, payload.username, payload.passwordHash, roleId, nowIso(),
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

module.exports = {
  listUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
};
