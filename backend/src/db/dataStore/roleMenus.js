const { getPool } = require("../pool");
const { DEFAULT_MENUS_BY_ROLE } = require("../../constants/roleMenus");
const { unwrapProcedureRows } = require("./unwrap");

async function getRoleIdByName(name) {
  const [rows] = await getPool().query("CALL sp_get_role_id_by_name(?)", [name]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? resultRows[0].id : null;
}

async function listMenuKeysForRoleName(roleName) {
  const [rows] = await getPool().query(
    `SELECT rm.menu_key
     FROM role_menus rm
     INNER JOIN roles r ON r.id = rm.role_id
     WHERE r.name = ?
     ORDER BY rm.menu_key ASC`,
    [roleName],
  );
  if (rows.length) {
    return rows.map((row) => row.menu_key);
  }
  return DEFAULT_MENUS_BY_ROLE[roleName] ? [...DEFAULT_MENUS_BY_ROLE[roleName]] : ["overview"];
}

async function listRoleMenusMap() {
  const [roles] = await getPool().query("SELECT id, name FROM roles ORDER BY id ASC");
  const [rows] = await getPool().query(
    `SELECT r.name AS role_name, rm.menu_key
     FROM role_menus rm
     INNER JOIN roles r ON r.id = rm.role_id
     ORDER BY r.id ASC, rm.menu_key ASC`,
  );
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
    await conn.query("DELETE FROM role_menus WHERE role_id = ?", [roleId]);
    for (const key of menuKeys) {
      await conn.query("INSERT INTO role_menus (role_id, menu_key) VALUES (?, ?)", [roleId, key]);
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
