const { getPool } = require("../pool");
const { DEFAULT_MENUS_BY_ROLE } = require("../../constants/roleMenus");
const { unwrapProcedureRows } = require("./unwrap");

async function getRoleIdByName(name) {
  const [rows] = await getPool().query("CALL sp_get_role_id_by_name(?)", [name]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? resultRows[0].id : null;
}

async function listMenuKeysForRoleName(roleName) {
  const [rowsRaw] = await getPool().query("CALL sp_list_role_menu_keys_by_role_name(?)", [roleName]);
  const rows = unwrapProcedureRows(rowsRaw);
  if (rows.length) {
    return rows.map((row) => row.menu_key);
  }
  return DEFAULT_MENUS_BY_ROLE[roleName] ? [...DEFAULT_MENUS_BY_ROLE[roleName]] : ["overview"];
}

async function listRoleMenusMap() {
  const [rolesRaw] = await getPool().query("CALL sp_list_roles()");
  const roles = unwrapProcedureRows(rolesRaw);
  const [rowsRaw] = await getPool().query("CALL sp_list_role_menus()");
  const rows = unwrapProcedureRows(rowsRaw);
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
