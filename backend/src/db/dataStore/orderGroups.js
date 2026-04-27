const { getPool } = require("../pool");

async function listOrderGroups() {
  const [rows] = await getPool().query(
    "SELECT id, name FROM order_groups ORDER BY name ASC",
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

async function getOrderGroupById(id) {
  const [rows] = await getPool().query(
    "SELECT id, name FROM order_groups WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    name: rows[0].name,
  };
}

module.exports = {
  listOrderGroups,
  getOrderGroupById,
};
