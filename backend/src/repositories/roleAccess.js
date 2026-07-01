const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listRolesWithDataScope() {
  const [rows] = await getPool().query(
    `SELECT id, name, data_scope FROM ${V.ROLES} ORDER BY id ASC`,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    dataScope: row.data_scope,
  }));
}

async function listDataScopeMap() {
  const roles = await listRolesWithDataScope();
  return Object.fromEntries(roles.map((r) => [r.name, r.dataScope]));
}

async function updateRoleDataScope(roleName, dataScope) {
  const [result] = await getPool().query(
    "UPDATE roles SET data_scope = ? WHERE name = ?",
    [dataScope, roleName],
  );
  if (!result.affectedRows) {
    throw new Error("Role not found");
  }
  return dataScope;
}

async function getRoleAccessMatrix() {
  const roles = await listRolesWithDataScope();
  const { listRoleClientsMap } = require("./roleClients");
  const { listRoleStatusPermissionsMap } = require("./roleStatusPermissions");
  const { listRoleSocketChannelsMap } = require("./roleSocketChannels");

  const [clientsMap, statusPermsMap, socketMap] = await Promise.all([
    listRoleClientsMap(),
    listRoleStatusPermissionsMap(),
    listRoleSocketChannelsMap(),
  ]);

  return roles.map((role) => ({
    roleName: role.name,
    dataScope: role.dataScope,
    clients: clientsMap[role.name] || [],
    statusPermissions: statusPermsMap[role.name] || {},
    socketChannels: socketMap[role.name] || [],
  }));
}

module.exports = {
  listRolesWithDataScope,
  listDataScopeMap,
  updateRoleDataScope,
  getRoleAccessMatrix,
};
