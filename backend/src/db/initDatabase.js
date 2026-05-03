const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

function getSeedPassword(name, fallback) {
  const value = process.env[name];
  if (value && String(value).trim()) return String(value).trim();
  // Local/test environments can safely use fallback seed passwords.
  // Production is already protected by ALLOW_PRODUCTION_DB_INIT gate below.
  if (process.env.NODE_ENV !== "production") return fallback;
  throw new Error(`Missing required seed password env: ${name}`);
}

async function run() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_DB_INIT !== "true") {
    throw new Error("Refusing to run initDatabase in production without ALLOW_PRODUCTION_DB_INIT=true");
  }

  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "fix_asset_db"}\` CHARACTER SET utf8 COLLATE utf8_general_ci`);
  await rootConn.end();

  const dbConn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fix_asset_db",
    multipleStatements: true,
  });

  const schemaPath = path.resolve(__dirname, "../../db/schema.mysql55.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await dbConn.query(schemaSql);

  await dbConn.query("DELETE FROM order_status_history");
  await dbConn.query("DELETE FROM user_activity_logs");
  await dbConn.query("DELETE FROM payments");
  await dbConn.query("DELETE FROM bakong_tokens");
  await dbConn.query("DELETE FROM bakong_transactions");
  await dbConn.query("DELETE FROM orders");
  await dbConn.query("DELETE FROM payment_methods");
  await dbConn.query("DELETE FROM items");
  await dbConn.query("DELETE FROM catalogs");
  await dbConn.query("DELETE FROM addresses");
  await dbConn.query("DELETE FROM order_groups");
  await dbConn.query("DELETE FROM customers");
  await dbConn.query("DELETE FROM depots");
  await dbConn.query("DELETE FROM trucks");
  await dbConn.query("DELETE FROM producers");
  await dbConn.query("DELETE FROM delivery_agents");
  await dbConn.query("DELETE FROM users");
  await dbConn.query("DELETE FROM role_menus");
  await dbConn.query("DELETE FROM roles");

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
    `INSERT INTO role_menus (role_id, menu_key) VALUES
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customers'), (1, 'depots'),
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'trucks'), (1, 'orders'), (1, 'payments'), (1, 'users'), (1, 'activityLogs'),
     (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customers'), (2, 'depots'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'trucks'), (2, 'orders'), (2, 'payments'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'trucks'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'), (5, 'payments'),
     (6, 'overview'), (6, 'customers'), (6, 'orders'), (6, 'borrowedMaterials')`,
  );

  const adminHash = bcrypt.hashSync(getSeedPassword("SEED_ADMIN_PASSWORD", "admin123"), 10);
  const ownerHash = bcrypt.hashSync(getSeedPassword("SEED_OWNER_PASSWORD", "owner123"), 10);
  const logisticsHash = bcrypt.hashSync(getSeedPassword("SEED_LOGISTICS_PASSWORD", "logistics123"), 10);
  const deliveryHash = bcrypt.hashSync(getSeedPassword("SEED_DELIVERY_PASSWORD", "delivery123"), 10);
  const customerHash = bcrypt.hashSync(getSeedPassword("SEED_CUSTOMER_PASSWORD", "customer123"), 10);
  const depotHash = bcrypt.hashSync(getSeedPassword("SEED_DEPOT_PASSWORD", "depot123"), 10);
  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, is_active, updated_at) VALUES
      (1, 'System Admin', 'admin', '${adminHash}', 1, 1, NOW()),
      (2, 'Business Owner', 'owner', '${ownerHash}', 2, 1, NOW()),
      (3, 'Logistics User', 'logistics', '${logisticsHash}', 3, 1, NOW()),
      (4, 'Delivery User', 'delivery', '${deliveryHash}', 4, 1, NOW()),
      (5, 'Customer User 1', 'customer1', '${customerHash}', 5, 1, NOW()),
      (6, 'Customer User 2', 'customer2', '${customerHash}', 5, 1, NOW()),
      (7, 'Customer User 3', 'customer3', '${customerHash}', 5, 1, NOW()),
      (8, 'Customer User 4', 'customer4', '${customerHash}', 5, 1, NOW()),
      (9, 'Depot User 1', 'depot1', '${depotHash}', 6, 1, NOW())`,
  );


  await dbConn.query(
    "INSERT INTO payment_methods (id, name) VALUES " +
      "(1, 'Cash'), " +
      "(2, 'Bank transfer'), " +
      "(3, 'Card')",
  );

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(`Database initialized with sample data: ${process.env.DB_NAME || "fix_asset_db"}`);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
