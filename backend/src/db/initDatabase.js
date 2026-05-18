const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { loadEnv, validateEnv } = require("../config/env");

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

/** Demo catalog, orders, and linked accounts for local / staging testing. */
async function seedSampleData(dbConn) {
  const adminHash = hashSeedPassword("SEED_ADMIN_PASSWORD", "admin123");
  const ownerHash = hashSeedPassword("SEED_OWNER_PASSWORD", "owner123");
  const depotHash = hashSeedPassword("SEED_DEPOT_PASSWORD", "depot123");
  const logisticsHash = hashSeedPassword("SEED_LOGISTICS_PASSWORD", "logistics123");
  const deliveryHash = hashSeedPassword("SEED_DELIVERY_PASSWORD", "delivery123");
  const customerHash = hashSeedPassword("SEED_CUSTOMER_PASSWORD", "customer123");

  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, is_active, updated_at) VALUES
      (1, 'System Admin', 'admin', '${adminHash}', 1, 1, NOW()),
      (2, 'Business Owner', 'owner', '${ownerHash}', 2, 1, NOW()),
      (3, 'Depot Staff', 'depot1', '${depotHash}', 6, 1, NOW()),
      (4, 'Logistics Coordinator', 'logistics', '${logisticsHash}', 3, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO depots (id, name, phone, address, owner_user_id, depot_user_id, is_active, updated_at) VALUES
      (1, 'Phnom Penh Central Depot', '023900100', 'Street 271, Phnom Penh', 2, 3, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO producers (id, name, phone, capacity_note, is_active, updated_at) VALUES
      (1, 'Mekong Beverage Factory', '023555100', '5000 units/day', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, updated_at) VALUES
      (1, 'Sokha Driver', '012345678', 'Motorbike', 1, NOW()),
      (2, 'Dara Driver', '098765432', 'Truck', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, delivery_agent_id, is_active, updated_at) VALUES
      (5, 'Sokha Driver', 'delivery', '${deliveryHash}', 4, 1, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO customers (id, name, phone, depot_id, latitude, longitude, is_active, updated_at) VALUES
      (1, 'Star Mart Toul Kork', '011111111', 1, 11.5500000, 104.9200000, 1, NOW()),
      (2, 'Green Cafe Riverside', '011222222', 1, 11.5600000, 104.9350000, 1, NOW()),
      (3, 'City Mini Mart', '011333333', 1, 11.5450000, 104.9100000, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, customer_id, is_active, updated_at) VALUES
      (6, 'Star Mart Account', 'customer', '${customerHash}', 5, 1, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO catalogs (id, name, note, is_active, updated_at) VALUES
      (1, 'Soft Drinks', 'Bottled beverages', 1, NOW()),
      (2, 'Snacks', 'Packaged snacks', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO items (id, catalog_id, name, sku, is_active, updated_at) VALUES
      (1, 1, 'Cola 330ml', 'DRK-COLA-330', 1, NOW()),
      (2, 1, 'Mineral Water 500ml', 'DRK-WATER-500', 1, NOW()),
      (3, 2, 'Potato Chips 50g', 'SNK-CHIPS-50', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO customer_item_prices (customer_id, item_id, currency, unit_price, updated_at) VALUES
      (1, 1, 'KHR', 1500.00, NOW()),
      (1, 2, 'KHR', 1200.00, NOW()),
      (1, 3, 'KHR', 5000.00, NOW()),
      (2, 1, 'KHR', 1550.00, NOW()),
      (2, 2, 'KHR', 1250.00, NOW()),
      (3, 1, 'KHR', 1500.00, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO order_groups (id, name, updated_at) VALUES
      (1, 'March 2026 Promo Batch', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO borrow_materials (id, name, unit, note, is_active, updated_at) VALUES
      (1, 'Glass Bottle Crate', 'crate', 'Returnable crate', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO customer_borrowed_materials (customer_id, material_id, qty, note, updated_at) VALUES
      (1, 1, 4, 'Demo borrowed crates', NOW())`,
  );

  // status: 1=Owner_Preparing, 2=Sent_To_Factory, 3=Ready_For_Delivery, 4=Recieve_By_Customer
  await dbConn.query(
    `INSERT INTO orders (
      id, customer_id, order_group_id, item_id, currency, ordered_qty, unit_price,
      producer_id, delivery_agent_id, amount_total, status, updated_at
    ) VALUES
      (1, 1, 1, 1, 'KHR', 100, 1500.00, 1, 1, 150000.00, 3, NOW()),
      (2, 1, NULL, 2, 'KHR', 50, 1200.00, 1, 1, 60000.00, 2, NOW()),
      (3, 2, NULL, 1, 'KHR', 200, 1550.00, 1, NULL, 310000.00, 1, NOW()),
      (4, 3, NULL, 3, 'KHR', 30, 5000.00, 1, 1, 150000.00, 4, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id, note) VALUES
      (1, 2, 3, 4, 'Ready for delivery - demo seed'),
      (2, 1, 2, 2, 'Sent to factory - demo seed'),
      (3, NULL, 1, 2, 'Order created - demo seed'),
      (4, 3, 4, 5, 'Delivered - demo seed')`,
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

  const schemaPath = path.resolve(__dirname, "../../db/schema.mysql55.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await dbConn.query(schemaSql);

  await dbConn.query("DELETE FROM order_status_history");
  await dbConn.query("DELETE FROM borrow_material_monthly_installments");
  await dbConn.query("DELETE FROM borrow_material_monthly_schedules");
  await dbConn.query("DELETE FROM borrow_material_order_loans");
  await dbConn.query("DELETE FROM orders");
  await dbConn.query("DELETE FROM customer_item_prices");
  await dbConn.query("DELETE FROM customer_borrowed_materials");
  await dbConn.query("DELETE FROM borrow_materials");
  await dbConn.query("DELETE FROM items");
  await dbConn.query("DELETE FROM catalogs");
  await dbConn.query("DELETE FROM customers");
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
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'orders'), (1, 'orderGroups'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'), (1, 'customerOrderHistory'),
     (1, 'users'),
     (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'trackingCustomerLocation'), (2, 'depots'), (2, 'customersByDepot'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'orders'), (2, 'orderGroups'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'), (2, 'customerOrderHistory'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'), (5, 'customerOrderHistory'),
     (6, 'overview'), (6, 'customers'), (6, 'trackingCustomerLocation'), (6, 'customersByDepot'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'customerOrderHistory'), (6, 'borrowedMaterials')`,
  );

  await seedSampleData(dbConn);

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(
    `Database initialized with sample data: ${process.env.DB_NAME || "fix_asset_db"}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    "Demo logins: admin/admin123, owner/owner123, depot1/depot123, logistics/logistics123, delivery/delivery123, customer/customer123",
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
