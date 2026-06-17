const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { loadEnv, validateEnv } = require("../src/config/env");

loadEnv();
validateEnv(["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME", "DB_PASSWORD"]);

function getSeedPassword(name, fallback) {
  const value = process.env[name];
  if (value && String(value).trim()) return String(value).trim();
  if (process.env.NODE_ENV !== "production") return fallback;
  throw new Error(`Missing required seed password env: ${name}`);
}

function hashSeedPassword(name, fallback) {
  return bcrypt.hashSync(getSeedPassword(name, fallback), 10);
}

/** Demo roles, menus, and staff accounts for local / staging user-management testing. */
async function seedUserManagementData(dbConn) {
  const adminHash = hashSeedPassword("SEED_ADMIN_PASSWORD", "admin123");
  const ownerHash = hashSeedPassword("SEED_OWNER_PASSWORD", "owner123");
  const depotHash = hashSeedPassword("SEED_DEPOT_PASSWORD", "depot123");
  const logisticsHash = hashSeedPassword("SEED_LOGISTICS_PASSWORD", "logistics123");

  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, is_active, updated_at) VALUES
      (1, 'System Admin', 'admin', '${adminHash}', 1, 1, NOW()),
      (2, 'Business Owner', 'owner', '${ownerHash}', 2, 1, NOW()),
      (3, 'Depot Staff', 'depot1', '${depotHash}', 6, 1, NOW()),
      (4, 'Logistics Coordinator', 'logistics', '${logisticsHash}', 3, 1, NOW())`,
  );
}

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

  await dbConn.query("DELETE FROM payment_with_aba");
  await dbConn.query("DELETE FROM payment_with_khqr");
  await dbConn.query("DELETE FROM payments");
  await dbConn.query("DELETE FROM delivery_agent_locations");
  await dbConn.query("DELETE FROM order_status_history");
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
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customerItemPrices'), (1, 'customers'), (1, 'trackingCustomerLocation'), (1, 'provinces'), (1, 'depots'), (1, 'customersByDepot'),
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'orders'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'), (1, 'customerOrderHistory'),
     (1, 'users'),
     (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'trackingCustomerLocation'), (2, 'provinces'), (2, 'depots'), (2, 'customersByDepot'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'orders'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'), (2, 'customerOrderHistory'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'), (5, 'customerOrderHistory'),
     (6, 'overview'), (6, 'customers'), (6, 'trackingCustomerLocation'), (6, 'customersByDepot'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'customerOrderHistory'), (6, 'borrowedMaterials')`,
  );

  await seedUserManagementData(dbConn);

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(
    `Database initialized (roles, menus, users): ${process.env.DB_NAME || "fix_asset_db"}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    "Demo logins: admin/admin123, owner/owner123, depot1/depot123, logistics/logistics123",
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
