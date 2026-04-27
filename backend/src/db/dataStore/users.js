const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapUser } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");
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
  const [result] = await getPool().query(
    "INSERT INTO users (name, username, password_hash, role_id, is_active, updated_at) VALUES (?, ?, ?, ?, 1, ?)",
    [payload.name, payload.username, payload.passwordHash, roleId, nowIso()],
  );
  return getUserById(result.insertId);
}

async function updateUser(id, payload) {
  const updates = [];
  const params = [];
  if (payload.name !== undefined) {
    updates.push("name = ?");
    params.push(payload.name);
  }
  if (payload.username !== undefined) {
    updates.push("username = ?");
    params.push(payload.username);
  }
  if (payload.role !== undefined) {
    const roleId = await getRoleIdByName(payload.role);
    if (!roleId) {
      throw new Error("Role not found");
    }
    updates.push("role_id = ?");
    params.push(roleId);
  }
  if (payload.passwordHash !== undefined) {
    updates.push("password_hash = ?");
    params.push(payload.passwordHash);
  }
  if (!updates.length) return getUserById(id);
  updates.push("updated_at = ?");
  params.push(nowIso(), id);
  const [result] = await getPool().query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );
  if (!result.affectedRows) return null;
  return getUserById(id);
}

async function deactivateUser(id) {
  const [result] = await getPool().query(
    "UPDATE users SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
};
