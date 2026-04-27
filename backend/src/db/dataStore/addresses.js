const { getPool } = require("../pool");
const { mapAddress } = require("./mappers");

async function listAddresses() {
  const [rows] = await getPool().query(
    `SELECT a.id, a.name, a.group_id, g.name AS group_name
     FROM addresses a
     INNER JOIN address_groups g ON g.id = a.group_id
     ORDER BY g.name ASC, a.name ASC`,
  );
  return rows.map(mapAddress);
}

module.exports = {
  listAddresses,
};
