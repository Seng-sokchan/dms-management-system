const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listRoles() {
  const [rows] = await getPool().query(
    `SELECT id, name, data_scope FROM ${V.ROLES} ORDER BY id ASC`,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    dataScope: row.data_scope,
  }));
}

async function listRoleNames() {
  const roles = await listRoles();
  return roles.map((row) => row.name);
}

module.exports = {
  listRoles,
  listRoleNames,
};
