const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listRoleSocketChannelsMap() {
  const [rows] = await getPool().query(
    `SELECT role_name, channel_key FROM ${V.ROLE_SOCKET_CHANNELS}`,
  );
  const byRole = {};
  for (const row of rows) {
    if (!byRole[row.role_name]) byRole[row.role_name] = [];
    byRole[row.role_name].push(row.channel_key);
  }
  return byRole;
}

async function listSocketChannelsForRoleName(roleName) {
  const [rows] = await getPool().query(
    `SELECT channel_key FROM ${V.ROLE_SOCKET_CHANNELS} WHERE role_name = ?`,
    [roleName],
  );
  return rows.map((row) => row.channel_key);
}

async function replaceRoleSocketChannels(roleName, channelKeys) {
  const { getRoleIdByName } = require("./roleMenus");
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) {
    throw new Error("Role not found");
  }
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("CALL sp_delete_role_socket_channels_by_role_id(?)", [roleId]);
    for (const channelKey of channelKeys) {
      await conn.query("CALL sp_add_role_socket_channel(?, ?)", [roleId, channelKey]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return listSocketChannelsForRoleName(roleName);
}

module.exports = {
  listRoleSocketChannelsMap,
  listSocketChannelsForRoleName,
  replaceRoleSocketChannels,
};
