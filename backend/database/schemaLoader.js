const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "sql/schema.mysql55.sql");
const READ_VIEWS_PATH = path.join(__dirname, "sql/readViews.mysql55.sql");
const RUNTIME_UPGRADE_PATH = path.join(__dirname, "sql/runtimeUpgrade.mysql55.sql");

function readReadViewsSql() {
  return fs
    .readFileSync(READ_VIEWS_PATH, "utf8")
    .replace(/^--.*\n/, "")
    .trim();
}

function readRuntimeUpgradeSql() {
  const runtime = fs.readFileSync(RUNTIME_UPGRADE_PATH, "utf8").trim();
  const views = readReadViewsSql();
  return `${runtime}\n\n${views}`;
}

function readFullSchemaSql() {
  return fs.readFileSync(SCHEMA_PATH, "utf8");
}

module.exports = {
  SCHEMA_PATH,
  readRuntimeUpgradeSql,
  readFullSchemaSql,
};
