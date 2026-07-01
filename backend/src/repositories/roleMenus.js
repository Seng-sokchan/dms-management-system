const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function getRoleIdByName(name) {
  const [rows] = await getPool().query(`SELECT id FROM ${V.ROLES} WHERE name = ? LIMIT 1`, [name]);
  return rows[0] ? rows[0].id : null;
}

async function listMenuKeysForRoleName(roleName, { client } = {}) {
  let sql = `SELECT menu_key, client FROM ${V.ROLE_MENUS} WHERE role_name = ?`;
  const params = [roleName];
  if (client) {
    sql += " AND client = ?";
    params.push(client);
  }
  sql += " ORDER BY menu_key DESC";
  const [rows] = await getPool().query(sql, params);
  return rows.map((row) => row.menu_key);
}

async function listManageMenuKeysForRoleName(roleName, { client } = {}) {
  let sql = `SELECT menu_key FROM ${V.ROLE_MENUS} WHERE role_name = ? AND access_level = 'manage'`;
  const params = [roleName];
  if (client) {
    sql += " AND client = ?";
    params.push(client);
  }
  const [rows] = await getPool().query(sql, params);
  return rows.map((row) => row.menu_key);
}

async function listRoleMenusMap({ client } = {}) {
  const [roles] = await getPool().query(`SELECT id, name FROM ${V.ROLES} ORDER BY id DESC`);
  let sql = `SELECT role_name, menu_key FROM ${V.ROLE_MENUS}`;
  const params = [];
  if (client) {
    sql += " WHERE client = ?";
    params.push(client);
  }
  const [rows] = await getPool().query(sql, params);
  const byRole = {};
  for (const r of roles) {
    byRole[r.name] = [];
  }
  for (const row of rows) {
    if (!byRole[row.role_name]) byRole[row.role_name] = [];
    byRole[row.role_name].push(row.menu_key);
  }
  return byRole;
}

async function replaceRoleMenus(roleName, menuKeys) {
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) {
    throw new Error("Role not found");
  }
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("CALL sp_delete_role_menus_by_role_id(?)", [roleId]);
    for (const key of menuKeys) {
      await conn.query("CALL sp_add_role_menu(?, ?)", [roleId, key]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return listMenuKeysForRoleName(roleName);
}

module.exports = {
  getRoleIdByName,
  listMenuKeysForRoleName,
  listManageMenuKeysForRoleName,
  listRoleMenusMap,
  replaceRoleMenus,
};
