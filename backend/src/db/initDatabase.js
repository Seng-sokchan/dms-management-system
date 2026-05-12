const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { loadEnv, validateEnv } = require("../config/env");

loadEnv();
validateEnv(["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"]);

function getSeedPassword(name, fallback) {
  const value = process.env[name];
  if (value && String(value).trim()) return String(value).trim();
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

  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "fix_asset_db"}\` CHARACTER SET utf8 COLLATE utf8_general_ci`,
  );
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
  await dbConn.query("DELETE FROM borrow_material_monthly_schedules");
  await dbConn.query("DELETE FROM borrow_material_order_loans");
  await dbConn.query("DELETE FROM orders");
  await dbConn.query("DELETE FROM customer_borrowed_materials");
  await dbConn.query("DELETE FROM borrow_materials");
  await dbConn.query("DELETE FROM items");
  await dbConn.query("DELETE FROM catalogs");
  await dbConn.query("DELETE FROM customers");
  await dbConn.query("DELETE FROM addresses");
  await dbConn.query("DELETE FROM order_groups");
  await dbConn.query("DELETE FROM delivery_agents");
  await dbConn.query("DELETE FROM producers");
  await dbConn.query("DELETE FROM depots");
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
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customerItemPrices'), (1, 'customers'), (1, 'trackingCustomerLocation'), (1, 'depots'), (1, 'customersByDepot'),
     (1, 'addresses'), (1, 'producers'), (1, 'deliveryAgents'), (1, 'orders'), (1, 'orderGroups'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'),
     (1, 'users'),
     (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'trackingCustomerLocation'), (2, 'depots'), (2, 'customersByDepot'),
     (2, 'addresses'), (2, 'producers'), (2, 'deliveryAgents'), (2, 'orders'), (2, 'orderGroups'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'),
     (6, 'overview'), (6, 'addresses'), (6, 'customers'), (6, 'trackingCustomerLocation'), (6, 'customersByDepot'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'borrowedMaterials')`,
  );

  const adminHash = bcrypt.hashSync(getSeedPassword("SEED_ADMIN_PASSWORD", "admin123"), 10);
  const ownerHash = bcrypt.hashSync(getSeedPassword("SEED_OWNER_PASSWORD", "owner123"), 10);
  const depotHash = bcrypt.hashSync(getSeedPassword("SEED_DEPOT_PASSWORD", "depot123"), 10);

  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, is_active, updated_at) VALUES
      (1, 'System Admin', 'admin', '${adminHash}', 1, 1, NOW()),
      (2, 'Business Owner', 'owner', '${ownerHash}', 2, 1, NOW()),
      (3, 'Depot Staff', 'depot1', '${depotHash}', 6, 1, NOW())`,
  );

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(
    `Database initialized (schema + roles/menus + admin/owner/depot users only): ${process.env.DB_NAME || "fix_asset_db"}`,
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
