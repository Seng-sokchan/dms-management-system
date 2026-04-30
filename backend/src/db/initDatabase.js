const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function run() {
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
      "(5, 'Customer')",
  );

  await dbConn.query(
    `INSERT INTO role_menus (role_id, menu_key) VALUES
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customers'),
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'trucks'), (1, 'orders'), (1, 'payments'), (1, 'users'), (1, 'activityLogs'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customers'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'trucks'), (2, 'orders'), (2, 'payments'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'trucks'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (5, 'overview'), (5, 'orders'), (5, 'payments')`,
  );

  const adminHash = bcrypt.hashSync("admin123", 10);
  const ownerHash = bcrypt.hashSync("owner123", 10);
  const logisticsHash = bcrypt.hashSync("logistics123", 10);
  const deliveryHash = bcrypt.hashSync("delivery123", 10);
  const customerHash = bcrypt.hashSync("customer123", 10);
  await dbConn.query(
    `INSERT INTO users (id, name, username, password_hash, role_id, is_active, updated_at) VALUES
      (1, 'System Admin', 'admin', '${adminHash}', 1, 1, NOW()),
      (2, 'Business Owner', 'owner', '${ownerHash}', 2, 1, NOW()),
      (3, 'Logistics User', 'logistics', '${logisticsHash}', 3, 1, NOW()),
      (4, 'Delivery User', 'delivery', '${deliveryHash}', 4, 1, NOW()),
      (5, 'Customer User 1', 'customer1', '${customerHash}', 5, 1, NOW()),
      (6, 'Customer User 2', 'customer2', '${customerHash}', 5, 1, NOW()),
      (7, 'Customer User 3', 'customer3', '${customerHash}', 5, 1, NOW()),
      (8, 'Customer User 4', 'customer4', '${customerHash}', 5, 1, NOW())`,
  );

  await dbConn.query(
    "INSERT INTO producers (id, name, phone, capacity_note, is_active, updated_at) VALUES " +
      "(1, 'Green Valley Mfg', '010-555-1001', 'Bottling and crates; est. 8k units/day', 1, NOW()), " +
      "(2, 'Urban Pack Co', '010-555-2002', 'Bags, labels, retail packs', 1, NOW())",
  );

  await dbConn.query(
    "INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, updated_at) VALUES " +
      "(1, 'City Express', '010-555-3003', 'Van / city routes', 1, NOW()), " +
      "(2, 'FleetLine Trucking', '010-555-4004', 'Flatbed / long haul', 1, NOW())",
  );

  await dbConn.query(
    "INSERT INTO trucks (id, code, plate_no, delivery_agent_id, capacity_note, is_active, updated_at) VALUES " +
      "(1, 'TRK-01', 'PP-2A-1234', 1, 'Medium box truck for city routes', 1, NOW()), " +
      "(2, 'TRK-02', 'PP-2B-5678', 2, 'Large truck for mixed customer loads', 1, NOW())",
  );

  await dbConn.query(
    "INSERT INTO order_groups (id, name, updated_at) VALUES " +
      "(1, 'Phnom Penh', NOW()), " +
      "(2, 'Battambang', NOW()), " +
      "(3, 'Siem Reap', NOW())",
  );

  await dbConn.query(
    "INSERT INTO addresses (id, name, order_group_id, updated_at) VALUES " +
      "(1, 'Central Market', 1, NOW()), " +
      "(2, 'Street 271', 1, NOW()), " +
      "(3, 'City Center', 2, NOW()), " +
      "(4, 'Old Market', 3, NOW())",
  );

  await dbConn.query(
    "INSERT INTO customers (id, name, phone, address, user_id, sub_address, is_active, updated_at) VALUES " +
      "(1, 'ACME Trading Co', '012-111-2001', 1, 5, 'No. 12, Central Market', 1, NOW()), " +
      "(2, 'Bay Distributors', '012-222-3002', 2, 6, 'St. 271, Phnom Penh', 1, NOW()), " +
      "(3, 'Summit Mart', '012-333-4003', 3, 7, 'Battambang city center', 1, NOW()), " +
      "(4, 'Loft Organics', '012-444-5004', 4, 8, 'Siem Reap old market area', 1, NOW())",
  );

  await dbConn.query(
    "INSERT INTO catalogs (id, name, note, is_active, updated_at) VALUES " +
      "(1, 'Retail and POS', 'Store-facing SKUs and small packs', 1, NOW()), " +
      "(2, 'Wholesale bulk', 'Bags, pallets, large consignments', 1, NOW())",
  );

  await dbConn.query(
    "INSERT INTO items (id, catalog_id, name, sku, default_unit_price_usd, default_unit_price_khr, is_active, updated_at) VALUES " +
      "(1, 1, 'Standard shipping crate', 'RC-CR-01', 12.50, 51250.00, 1, NOW()), " +
      "(2, 1, 'Thermal label roll (2k)', 'LB-TL-2K', 3.20, 13120.00, 1, NOW()), " +
      "(3, 1, 'Counter display box', 'DB-DSP-S', 5.00, 20500.00, 1, NOW()), " +
      "(4, 2, 'Bulk bag 25kg', 'BK-B25', 8.00, 32800.00, 1, NOW()), " +
      "(5, 2, 'Pallet corner set (4pc)', 'PL-CR-4', 18.00, 73800.00, 1, NOW())",
  );

  await dbConn.query(
    `INSERT INTO orders
    (id, customer_id, address, order_group_id, item_id, ordered_qty, unit_price, producer_id, truck_id, delivery_agent_id,
     delivered_qty, loss_qty, remaining_qty, discrepancy, amount_total, amount_paid, payment_status, status, delivery_time, updated_at)
    VALUES
    (1, 1, 1, 1, 1, 10, 12.50, 1, 1, 1,
      0, 0, 0, 0, 125.00, 0.00, 1, 1, NULL, NOW()),
    (2, 2, 2, 1, 4, 100, 8.00, 2, 2, 2,
      0, 0, 0, 0, 800.00, 200.00, 1, 2, NULL, NOW()),
    (3, 3, 3, 2, 2, 50, 3.20, 1, 1, 1,
      50, 0, 0, 0, 160.00, 160.00, 2, 6, NOW(), NOW()),
    (4, 4, 4, 3, 5, 4, 18.00, 2, 2, 1,
      4, 0, 0, 0, 72.00, 72.00, 2, 6, NOW(), NOW())`,
  );

  await dbConn.query(
    "INSERT INTO payment_methods (id, name) VALUES " +
      "(1, 'Cash'), " +
      "(2, 'Bank transfer'), " +
      "(3, 'Card')",
  );

  await dbConn.query(
    "INSERT INTO payments (id, order_id, amount, method, note) VALUES " +
      "(1, 2, 200.00, 2, 'Sample partial payment'), " +
      "(2, 3, 160.00, 1, 'Sample: delivered line settled'), " +
      "(3, 4, 72.00, 3, 'Sample: closed order')",
  );

  await dbConn.query(
    "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id, note) VALUES " +
      "(2, 1, 2, 2, 'Sample: owner prepared and assigned to truck')",
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
