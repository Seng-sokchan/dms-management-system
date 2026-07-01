const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "sql/schema.mysql55.sql");

function readFullSchemaSql() {
  return fs.readFileSync(SCHEMA_PATH, "utf8");
}

module.exports = {
  SCHEMA_PATH,
  readFullSchemaSql,
};
