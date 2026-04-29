const { getPool } = require("../db/pool");
const { mapAddress } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

async function listAddresses() {
  const [rows] = await getPool().query("CALL sp_list_addresses()");
  return unwrapProcedureRows(rows).map(mapAddress);
}

module.exports = {
  listAddresses,
};
