/**
 * Export current database DDL (tables + views) for schema recovery.
 * Usage: node scripts/export-db-ddl.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("../src/config/env").loadEnv();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const [tables] = await conn.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );

  const lines = ["SET NAMES utf8;", "SET FOREIGN_KEY_CHECKS = 0;", ""];
  for (const { table_name: tableName } of tables) {
    lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
  }
  lines.push("");
  for (const { table_name: tableName } of tables) {
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    lines.push(`${rows[0]["Create Table"]};`);
    lines.push("");
  }

  const [views] = await conn.query(
    `SELECT table_name FROM information_schema.views
     WHERE table_schema = DATABASE()
     ORDER BY table_name`,
  );
  for (const { table_name: viewName } of views) {
    lines.push(`DROP VIEW IF EXISTS \`${viewName}\`;`);
  }
  lines.push("");
  for (const { table_name: viewName } of views) {
    const [rows] = await conn.query(`SHOW CREATE VIEW \`${viewName}\``);
    lines.push(`${rows[0]["Create View"]};`);
    lines.push("");
  }

  lines.push("SET FOREIGN_KEY_CHECKS = 1;");
  const outPath = path.join(__dirname, "../database/sql/bootstrap-from-db.sql");
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`Wrote ${outPath}`);
  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
