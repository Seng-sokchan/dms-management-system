const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "@dm!n",
  database: process.env.DB_NAME || "fix_asset_db",
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

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
