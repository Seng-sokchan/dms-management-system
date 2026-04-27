const { listAddresses: listAddressesDb } = require("../db/dataStore");

async function listAddresses(_req, res) {
  const rows = await listAddressesDb();
  res.json(rows);
}

module.exports = {
  listAddresses,
};
