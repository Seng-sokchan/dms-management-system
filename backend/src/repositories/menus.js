const { getPool } = require("../../database/pool");
const V = require("./sql/readViews");

async function listMenus({ client } = {}) {
  let sql = `SELECT menu_key, sort_order, client, access_level FROM ${V.MENUS}`;
  const params = [];
  if (client) {
    sql += " WHERE client = ?";
    params.push(client);
  }
  sql += " ORDER BY sort_order ASC, menu_key ASC";
  const [rows] = await getPool().query(sql, params);
  return rows.map((row) => ({
    menuKey: row.menu_key,
    sortOrder: Number(row.sort_order),
    client: row.client,
    accessLevel: row.access_level,
  }));
}

async function listMenuKeys({ client } = {}) {
  const menus = await listMenus({ client });
  return menus.map((row) => row.menuKey);
}

async function getMenuAccessLevel(menuKey) {
  const [rows] = await getPool().query(
    `SELECT access_level FROM ${V.MENUS} WHERE menu_key = ? LIMIT 1`,
    [menuKey],
  );
  return rows[0]?.access_level || "view";
}

module.exports = {
  listMenus,
  listMenuKeys,
  getMenuAccessLevel,
};
