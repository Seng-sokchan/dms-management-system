const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listRoleStatusPermissionsMap() {
  const [rows] = await getPool().query(
    `SELECT role_name, to_status, action FROM ${V.ROLE_STATUS_PERMISSIONS}`,
  );
  const byRole = {};
  for (const row of rows) {
    if (!byRole[row.role_name]) byRole[row.role_name] = {};
    if (!byRole[row.role_name][row.to_status]) byRole[row.role_name][row.to_status] = [];
    byRole[row.role_name][row.to_status].push(row.action);
  }
  return byRole;
}

async function listStatusPermissionsForRoleName(roleName) {
  const [rows] = await getPool().query(
    `SELECT to_status, action FROM ${V.ROLE_STATUS_PERMISSIONS} WHERE role_name = ?`,
    [roleName],
  );
  const byStatus = {};
  for (const row of rows) {
    if (!byStatus[row.to_status]) byStatus[row.to_status] = [];
    byStatus[row.to_status].push(row.action);
  }
  return byStatus;
}

async function replaceAllRoleStatusPermissions(matrix) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM role_status_permissions");
    for (const entry of matrix) {
      const { roleId, toStatusId, action } = entry;
      await conn.query("CALL sp_add_role_status_permission(?, ?, ?)", [
        roleId,
        toStatusId,
        action,
      ]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return listRoleStatusPermissionsMap();
}

module.exports = {
  listRoleStatusPermissionsMap,
  listStatusPermissionsForRoleName,
  replaceAllRoleStatusPermissions,
};
