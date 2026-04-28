const pool = require("../config/db");

function getPool() {
  return pool;
}

async function checkDbConnection() {
  const conn = await getPool().getConnection();
  await conn.ping();
  conn.release();
}

module.exports = {
  getPool,
  checkDbConnection,
};
