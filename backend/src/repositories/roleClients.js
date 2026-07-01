const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listRoleClientsMap() {
  const [rows] = await getPool().query(`SELECT role_name, client FROM ${V.ROLE_CLIENTS}`);
  const byRole = {};
  for (const row of rows) {
    if (!byRole[row.role_name]) byRole[row.role_name] = [];
    byRole[row.role_name].push(row.client);
  }
  return byRole;
}

async function listClientsForRoleName(roleName) {
  const [rows] = await getPool().query(
    `SELECT client FROM ${V.ROLE_CLIENTS} WHERE role_name = ? ORDER BY client ASC`,
    [roleName],
  );
  return rows.map((row) => row.client);
}

async function replaceRoleClients(roleName, clients) {
  const { getRoleIdByName } = require("./roleMenus");
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) {
    throw new Error("Role not found");
  }
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("CALL sp_delete_role_clients_by_role_id(?)", [roleId]);
    for (const client of clients) {
      await conn.query("CALL sp_add_role_client(?, ?)", [roleId, client]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return listClientsForRoleName(roleName);
}

module.exports = {
  listRoleClientsMap,
  listClientsForRoleName,
  replaceRoleClients,
};
