const { getPool } = require("../../database/pool");
const { getDataScopeForRole } = require("../constants/roleAccessRules");
const V = require("./sql/readViews");

async function getRoleIdByName(name) {
  const [rows] = await getPool().query(`SELECT id FROM ${V.ROLES} WHERE name = ? LIMIT 1`, [name]);
  return rows[0] ? rows[0].id : null;
}

async function listRoles() {
  const [rows] = await getPool().query(`SELECT id, name FROM ${V.ROLES} ORDER BY id ASC`);
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    dataScope: getDataScopeForRole(row.name),
  }));
}

async function listRoleNames() {
  const roles = await listRoles();
  return roles.map((row) => row.name);
}

module.exports = {
  getRoleIdByName,
  listRoles,
  listRoleNames,
};
