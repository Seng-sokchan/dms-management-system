const { getPool } = require("../../database/pool");
const { DEFAULT_MENUS_BY_ROLE } = require("../constants/roleMenus");
const V = require("./sql/readViews");

async function getRoleIdByName(name) {
  const [rows] = await getPool().query(`SELECT id FROM ${V.ROLES} WHERE name = ? LIMIT 1`, [name]);
  return rows[0] ? rows[0].id : null;
}

async function listMenuKeysForRoleName(roleName) {
  const [rows] = await getPool().query(
    `SELECT menu_key FROM ${V.ROLE_MENUS} WHERE role_name = ? ORDER BY menu_key DESC`,
    [roleName],
  );
  if (rows.length) {
    return rows.map((row) => row.menu_key);
  }
  return DEFAULT_MENUS_BY_ROLE[roleName] ? [...DEFAULT_MENUS_BY_ROLE[roleName]] : ["overview"];
}

async function listRoleMenusMap() {
  const [roles] = await getPool().query(`SELECT id, name FROM ${V.ROLES} ORDER BY id DESC`);
  const [rows] = await getPool().query(`SELECT role_name, menu_key FROM ${V.ROLE_MENUS}`);
  const byRole = {};
  for (const r of roles) {
    byRole[r.name] = [];
  }
  for (const row of rows) {
    if (!byRole[row.role_name]) byRole[row.role_name] = [];
    byRole[row.role_name].push(row.menu_key);
  }
  for (const r of roles) {
    if (!byRole[r.name].length && DEFAULT_MENUS_BY_ROLE[r.name]) {
      byRole[r.name] = [...DEFAULT_MENUS_BY_ROLE[r.name]];
    }
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
  listRoleMenusMap,
  replaceRoleMenus,
};
