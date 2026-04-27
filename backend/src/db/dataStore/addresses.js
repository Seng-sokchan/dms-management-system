const { getPool } = require("../pool");
const { mapAddress } = require("./mappers");

async function listAddresses() {
  const [rows] = await getPool().query(
    `SELECT a.id, a.name
     FROM addresses a
     ORDER BY a.name ASC`,
  );
  return rows.map(mapAddress);
}

module.exports = {
  listAddresses,
};
