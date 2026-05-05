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

  // Child / dependent rows first (FK-safe order).
  await dbConn.query("DELETE FROM order_status_history");
  await dbConn.query("DELETE FROM user_activity_logs");
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
  await dbConn.query("DELETE FROM trucks");
  await dbConn.query("DELETE FROM producers");
  await dbConn.query("DELETE FROM delivery_agents");
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
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customers'), (1, 'depots'),
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'trucks'), (1, 'orders'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'),
     (1, 'users'), (1, 'activityLogs'),
     (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customers'), (2, 'depots'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'trucks'), (2, 'orders'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'trucks'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'),
     (6, 'overview'), (6, 'customers'), (6, 'orders'), (6, 'payments'), (6, 'borrowedMaterials')`,
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
    `INSERT INTO depots (id, name, phone, address, owner_user_id, depot_user_id, is_active, updated_at) VALUES
      (1, 'Test Depot Alpha', '+85599111222', '100 Test Street', 2, 9, 1, NOW())`,
  );

  // Order groups: numeric road order (2, 3, 22, 31) so lists sort logically, not as strings (…22 before 3).
  await dbConn.query(
    `INSERT INTO order_groups (id, name, updated_at) VALUES
      (1, 'ផលូវជាតិ លេខ 2', NOW()),
      (2, 'ផលូវជាតិ លេខ 3', NOW()),
      (3, 'ផលូវជាតិ លេខ 22', NOW()),
      (4, 'ផលូវជាតិ លេខ 31', NOW()),
      (5, 'ផលូវជាតិលេខ', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO addresses (id, name, order_group_id, updated_at) VALUES
      (1, 'Delivery Point A — Riverside', 1, NOW()),
      (2, 'Delivery Point B — Industrial', 1, NOW()),
      (3, 'SR Warehouse Lane', 3, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO producers (id, name, phone, capacity_note, is_active, updated_at) VALUES
      (1, 'Eva Premium Ice', '', 'Ice production / distribution', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, updated_at) VALUES
      (1, 'Driver Sokha', '+85596111444', 'Truck — 3.5t', 1, NOW()),
      (2, 'Driver Vuthy', '+85595111555', 'Van', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO trucks (id, code, plate_no, delivery_agent_id, capacity_note, is_active, updated_at) VALUES
      (1, 'TRK-001', '2AI-9011', 1, 'Dry goods', 1, NOW()),
      (2, 'TRK-002', '2AI-9012', 2, 'Mixed', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO catalogs (id, name, note, is_active, updated_at) VALUES
      (1, 'Ice', 'ទឹកកក / Ice', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO items (id, catalog_id, name, sku, default_unit_price_usd, default_unit_price_khr, is_active, updated_at) VALUES
      (1, 1, 'ប្លាស្ទិច គ្រាប់តូច ( 16kg )', 'ICE-PLA-S-16', 0.50, 2050.00, 1, NOW()),
      (2, 1, 'ប្លាស្ទិច គ្រាប់ធំ ( 16kg )', 'ICE-PLA-L-16', 0.35, 1435.00, 1, NOW()),
      (3, 1, 'បេ ស គ្រាប់តូច ( 20kg )', 'ICE-BS-S-20', 1.20, 4920.00, 1, NOW()),
      (4, 1, 'បេ ស គ្រាប់ធំ ( 20kg )', 'ICE-BS-L-20', 1.50, 6150.00, 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO customers (id, name, phone, address, user_id, depot_id, sub_address, is_active, updated_at) VALUES
      (1, 'Retail Mart One', '+855111001', 1, 5, 1, 'Stall 4', 1, NOW()),
      (2, 'Corner Store (no phone)', NULL, 2, 6, 1, NULL, 1, NOW()),
      (3, 'Wholesale Partner', '+855111003', 3, 7, NULL, 'Gate B', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO borrow_materials (id, name, unit, note, is_active, updated_at) VALUES
      (1, 'Plastic Crate', 'pcs', 'Return within 30 days', 1, NOW()),
      (2, 'Pallet', 'pcs', 'Standard EU', 1, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO customer_borrowed_materials (id, customer_id, material_id, qty, note, updated_at) VALUES
      (1, 1, 1, 8, 'Seeded borrow for testing', NOW()),
      (2, 2, 2, 3, '', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO orders (
       id, customer_id, address, order_group_id, item_id, currency, ordered_qty, unit_price,
       producer_id, truck_id, delivery_time,
       amount_total, status, updated_at
     ) VALUES
      (
        1, 1, 1, 1, 1, 'KHR', 10, 0.50,
        1, 1, NULL,
        5.00, 1, NOW()
      ),
      (
        2, 2, 2, 1, 3, 'KHR', 20, 1.20,
        1, 2, NULL,
        24.00, 3, NOW()
      ),
      (
        3, 3, 3, 3, 2, 'KHR', 48, 0.35,
        1, 1, NULL,
        16.80, 4, NOW()
      )`,
  );

  await dbConn.query(
    `INSERT INTO borrow_material_order_loans (
       id, customer_id, material_id, order_id, fixed_unit_price, currency, ordered_qty, computed_line_total, note, updated_at
     ) VALUES
      (1, 1, 1, 1, 0.25, 'KHR', 10, 2.50, 'Seeded order-linked loan (10 * 0.25)', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO borrow_material_monthly_schedules (
       id, customer_id, material_id, total_amount, currency, total_period, start_due_date, note, updated_at
     ) VALUES
      (1, 1, 2, 120.00, 'KHR', 6, CURDATE(), 'Seeded 6-month schedule', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO borrow_material_monthly_installments (
       schedule_id, period_no, due_date, amount_due, status, updated_at
     ) VALUES
      (1, 1, CURDATE(), 20.00, 0, NOW()),
      (1, 2, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 20.00, 0, NOW()),
      (1, 3, DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 20.00, 0, NOW()),
      (1, 4, DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 20.00, 0, NOW()),
      (1, 5, DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 20.00, 0, NOW()),
      (1, 6, DATE_ADD(CURDATE(), INTERVAL 5 MONTH), 20.00, 0, NOW())`,
  );

  await dbConn.query(
    `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by_user_id, note, changed_at) VALUES
      (1, 1, NULL, 1, 1, 'Order created', NOW()),
      (2, 1, 1, 2, 2, 'Owner preparing', NOW()),
      (3, 2, NULL, 1, 1, 'Order created', NOW()),
      (4, 2, 1, 3, 3, 'Ready for delivery', NOW()),
      (5, 3, NULL, 1, 1, 'Order created', NOW()),
      (6, 3, 1, 4, 2, 'Received by customer', NOW())`,
  );

  await dbConn.query(
    `INSERT INTO user_activity_logs (user_id, username, role, method, path, status_code, message, created_at) VALUES
      (1, 'admin', 'Admin', 'GET', '/api/orders', 200, 'seed', NOW()),
      (2, 'owner', 'Owner', 'POST', '/api/orders', 201, 'seed', NOW())`,
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
