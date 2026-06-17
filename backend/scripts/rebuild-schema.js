/**
 * Rebuild schema.mysql55.sql from live DB bootstrap + write procedures + runtime upgrades.
 * Prerequisite: git checkout database/sql/schema.mysql55.sql (original with all procedures).
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../database/sql/schema.mysql55.sql");
const bootstrapPath = path.join(__dirname, "../database/sql/bootstrap-from-db.sql");
const readViewsPath = path.join(__dirname, "../database/sql/readViews.mysql55.sql");
const originalSchemaPath = path.join(__dirname, "../database/sql/schema.mysql55.original.sql");

if (!fs.existsSync(originalSchemaPath)) {
  fs.copyFileSync(schemaPath, originalSchemaPath);
}

const oldSchema = fs.readFileSync(originalSchemaPath, "utf8");
const bootstrap = fs.readFileSync(bootstrapPath, "utf8");

function isReadProcedure(name) {
  return (
    name.startsWith("sp_get_") ||
    name.startsWith("sp_list_") ||
    name.startsWith("sp_dashboard_")
  );
}

function extractWriteProcedures(sql) {
  const drops = new Set();
  const createsByName = new Map();
  const procRegex =
    /DROP PROCEDURE IF EXISTS (sp_\w+);|CREATE PROCEDURE (sp_\w+)\([\s\S]*?(?=\nCREATE PROCEDURE |\nDROP PROCEDURE |\n-- \d+\)|\nSET @|\nSET FOREIGN_KEY_CHECKS|\n-- >>> RUNTIME|$)/g;
  let match;
  while ((match = procRegex.exec(sql)) !== null) {
    if (match[1]) {
      if (!isReadProcedure(match[1])) drops.add(`DROP PROCEDURE IF EXISTS ${match[1]};`);
      continue;
    }
    const name = match[2];
    if (isReadProcedure(name)) continue;
    if (!createsByName.has(name)) {
      createsByName.set(
        name,
        `CREATE PROCEDURE ${match[0].slice(match[0].indexOf(name))}`.trim(),
      );
    }
  }
  return { drops: [...drops].sort(), creates: [...createsByName.values()] };
}

function extractRuntimeUpgrade(sql) {
  const marker = "-- 1) Ensure role_menus table";
  const start = sql.indexOf(marker);
  if (start < 0) return "";
  let runtime = sql.slice(start).replace(/\nSET FOREIGN_KEY_CHECKS = 1;\s*$/, "").trim();
  runtime = runtime.replace(/DROP PROCEDURE IF EXISTS[^\n]*\n/g, "");
  runtime = runtime.replace(
    /CREATE PROCEDURE[\s\S]*?(?=\n-- \d+\)|\nSET @|\nINSERT INTO |\nCREATE TABLE IF NOT EXISTS|\nDROP TABLE|\nDELETE FROM|$)/gm,
    "",
  );
  return runtime.replace(/\n{3,}/g, "\n\n").trim();
}

const { drops, creates } = extractWriteProcedures(oldSchema);
let runtime = extractRuntimeUpgrade(oldSchema);
runtime = `-- >>> RUNTIME_UPGRADE_START\n-- Runtime idempotent upgrades (legacy databases only).\n\n${runtime}\n\n-- >>> RUNTIME_UPGRADE_END`;

const bootstrapTables = bootstrap
  .replace(/DROP VIEW IF EXISTS[\s\S]*/m, "")
  .replace(/SET FOREIGN_KEY_CHECKS = 1;\s*$/, "")
  .trim();

const readViews = fs
  .readFileSync(readViewsPath, "utf8")
  .replace(/^--.*\n/, "")
  .trim();

const parts = [
  bootstrapTables,
  "",
  "-- Read views (replaces sp_get_* / sp_list_* for queries)",
  readViews,
  "",
  "-- Write stored procedures",
  ...drops,
  "",
  ...creates.map((c) => c.replace(/\s+$/, "")),
  "",
  runtime,
  "",
  "SET FOREIGN_KEY_CHECKS = 1;",
  "",
];

fs.writeFileSync(schemaPath, parts.join("\n"));
console.log(`Rebuilt ${schemaPath}: ${creates.length} unique write procedures`);
