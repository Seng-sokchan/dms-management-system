const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config({ override: true });

const REQUIRED_ENV_KEYS = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME", "DB_PASSWORD"];
const SEED_PASSWORD = process.env.DB_INIT_SEED_PASSWORD || "admin123";

const SEED_USERS = [
  { name: "System Admin", username: "admin", roleId: 1 },
  { name: "Owner User", username: "owner", roleId: 2 },
  { name: "Logistics User", username: "logistics", roleId: 3 },
  { name: "Delivery User", username: "delivery", roleId: 4 },
  { name: "Customer User", username: "customer", roleId: 5 },
  { name: "Depot User", username: "depot", roleId: 6 },
];

function validateEnv(requiredKeys = REQUIRED_ENV_KEYS) {
  const missing = requiredKeys.filter((key) => !String(process.env[key] || "").trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

validateEnv();

async function run() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_DB_INIT !== "true") {
    throw new Error("Refusing to run initDatabase in production without ALLOW_PRODUCTION_DB_INIT=true");
  }

  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "fix_asset_admin",
    password: process.env.DB_PASSWORD || "@dm!n",
    multipleStatements: true,
  });

  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "fix_asset_db"}\` CHARACTER SET utf8 COLLATE utf8_general_ci`,
  );
  await rootConn.end();

  const dbConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "@dm!n",
    database: process.env.DB_NAME || "fix_asset_db",
    multipleStatements: true,
  });

  const { readFullSchemaSql } = require("./schemaLoader");
  const schemaSql = readFullSchemaSql();
  await dbConn.query(schemaSql);

  await dbConn.query("DELETE FROM payments");
  await dbConn.query("DELETE FROM delivery_agent_locations");
  await dbConn.query("DELETE FROM borrow_material_monthly_installments");
  await dbConn.query("DELETE FROM borrow_material_monthly_schedules");
  await dbConn.query("DELETE FROM borrow_material_order_loans");
  await dbConn.query("DELETE FROM order_details");
  await dbConn.query("DELETE FROM orders");
  await dbConn.query("DELETE FROM depot_item_prices");
  await dbConn.query("DELETE FROM customer_item_prices");
  await dbConn.query("DELETE FROM customer_borrowed_materials");
  await dbConn.query("DELETE FROM borrow_materials");
  await dbConn.query("DELETE FROM items");
  await dbConn.query("DELETE FROM catalogs");
  await dbConn.query("DELETE FROM customers");
  await dbConn.query("DELETE FROM provinces");
  await dbConn.query("DELETE FROM delivery_agents");
  await dbConn.query("DELETE FROM producers");
  await dbConn.query("DELETE FROM depots");
  await dbConn.query("DELETE FROM users");
  await dbConn.query("DELETE FROM roles");
  await dbConn.query("DELETE FROM status");

  await dbConn.query(
    "INSERT INTO status (id, name, sort_order) VALUES " +
      "(1, 'Owner_Preparing', 1), " +
      "(2, 'Sent_To_Factory', 2), " +
      "(3, 'Ready_For_Delivery', 3), " +
      "(4, 'Recieve_By_Customer', 4)",
  );

  await dbConn.query(
    "INSERT INTO roles (id, name) VALUES " +
      "(1, 'Admin'), " +
      "(2, 'Owner'), " +
      "(3, 'Logistics'), " +
      "(4, 'Delivery'), " +
      "(5, 'Customer'), " +
      "(6, 'Depot')",
  );

  await dbConn.query(
    `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES ('special_day_enabled', '0', NOW())`,
  );

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const now = new Date();
  for (const user of SEED_USERS) {
    await dbConn.query(
      `INSERT INTO users (name, username, password_hash, role_id, is_active, updated_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [user.name, user.username, passwordHash, user.roleId, now],
    );
  }

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(
    `Database initialized (schema, roles, seed users): ${process.env.DB_NAME || "fix_asset_db"}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Seed logins (${SEED_USERS.map((u) => u.username).join(", ")}); password: ${SEED_PASSWORD}`,
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
