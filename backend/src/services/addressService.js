const { listAddresses: listAddressesDb } = require("../repositories");

async function listAddresses() {
  return listAddressesDb();
}

module.exports = { listAddresses };
