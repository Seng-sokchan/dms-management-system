const mysql = require("mysql2/promise");
require("dotenv").config({ override: true });

const REQUIRED_ENV_KEYS = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME", "DB_PASSWORD"];

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
  await dbConn.query("DELETE FROM role_socket_channels");
  await dbConn.query("DELETE FROM role_status_permissions");
  await dbConn.query("DELETE FROM role_clients");
  await dbConn.query("DELETE FROM role_menus");
  await dbConn.query("DELETE FROM status_transitions");
  await dbConn.query("DELETE FROM menus");
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
    "INSERT INTO status_transitions (from_status_id, to_status_id) VALUES " +
      "(1, 2), " +
      "(2, 3), " +
      "(3, 4)",
  );

  await dbConn.query(
    "INSERT INTO roles (id, name, data_scope) VALUES " +
      "(1, 'Admin', 'all'), " +
      "(2, 'Owner', 'owner'), " +
      "(3, 'Logistics', 'none'), " +
      "(4, 'Delivery', 'delivery_agent'), " +
      "(5, 'Customer', 'customer'), " +
      "(6, 'Depot', 'depot')",
  );

  await dbConn.query(
    `INSERT INTO menus (menu_key, sort_order, client, access_level) VALUES
     ('overview', 1, 'admin', 'view'), ('newOrder', 2, 'admin', 'view'), ('catalogs', 3, 'admin', 'manage'),
     ('items', 4, 'admin', 'manage'), ('customerItemPrices', 5, 'admin', 'manage'), ('customers', 6, 'admin', 'manage'),
     ('trackingCustomerLocation', 7, 'admin', 'view'), ('provinces', 8, 'admin', 'manage'), ('depots', 9, 'admin', 'manage'),
     ('customersByDepot', 10, 'admin', 'view'), ('producers', 11, 'admin', 'manage'), ('deliveryAgents', 12, 'admin', 'manage'),
     ('orders', 13, 'admin', 'view'), ('assignOrders', 14, 'admin', 'view'), ('orderMovement', 15, 'admin', 'view'),
     ('payments', 16, 'admin', 'view'), ('customerOrderHistory', 17, 'admin', 'view'), ('users', 18, 'admin', 'manage'),
     ('borrowedMaterials', 19, 'admin', 'manage'),
     ('mobile.newOrder', 101, 'mobile', 'view'), ('mobile.myOrders', 102, 'mobile', 'view'),
     ('mobile.tracking', 103, 'mobile', 'view'), ('mobile.profile', 104, 'mobile', 'view'),
     ('mobile.live', 105, 'mobile', 'view'), ('mobile.prepareBatch', 106, 'mobile', 'view'),
     ('mobile.depotOrders', 107, 'mobile', 'view')`,
  );

  await dbConn.query(
    `INSERT INTO role_clients (role_id, client) VALUES
     (1, 'admin'), (2, 'admin'), (3, 'admin'),
     (4, 'mobile'), (5, 'mobile'), (6, 'mobile')`,
  );

  await dbConn.query(
    `INSERT INTO role_status_permissions (role_id, to_status_id, action) VALUES
     (1, 1, 'update_status'), (1, 2, 'update_status'), (1, 3, 'update_status'), (1, 4, 'update_status'), (1, 4, 'confirm_delivery'),
     (2, 1, 'update_status'), (2, 2, 'update_status'), (2, 3, 'update_status'),
     (3, 3, 'update_status'),
     (4, 3, 'update_status'), (4, 4, 'update_status'), (4, 4, 'confirm_delivery')`,
  );

  await dbConn.query(
    `INSERT INTO role_socket_channels (role_id, channel_key) VALUES
     (1, 'delivery-locations-watcher'), (2, 'delivery-locations-watcher'),
     (3, 'delivery-locations-watcher'), (6, 'delivery-locations-watcher')`,
  );

  await dbConn.query(
    `INSERT INTO role_menus (role_id, menu_key) VALUES
     (1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customerItemPrices'), (1, 'customers'), (1, 'trackingCustomerLocation'), (1, 'provinces'), (1, 'depots'), (1, 'customersByDepot'),
     (1, 'producers'), (1, 'deliveryAgents'), (1, 'orders'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'), (1, 'customerOrderHistory'),
     (1, 'users'), (1, 'borrowedMaterials'),
     (2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'trackingCustomerLocation'), (2, 'provinces'), (2, 'depots'), (2, 'customersByDepot'),
     (2, 'producers'), (2, 'deliveryAgents'), (2, 'orders'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'), (2, 'customerOrderHistory'),
     (2, 'borrowedMaterials'),
     (3, 'overview'), (3, 'deliveryAgents'), (3, 'orders'),
     (4, 'overview'), (4, 'orders'),
     (4, 'mobile.live'), (4, 'mobile.profile'),
     (5, 'overview'), (5, 'orders'), (5, 'customerOrderHistory'),
     (5, 'mobile.newOrder'), (5, 'mobile.myOrders'), (5, 'mobile.tracking'), (5, 'mobile.profile'),
     (6, 'overview'), (6, 'customers'), (6, 'trackingCustomerLocation'), (6, 'customersByDepot'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'customerOrderHistory'), (6, 'borrowedMaterials'),
     (6, 'mobile.prepareBatch'), (6, 'mobile.depotOrders'), (6, 'mobile.tracking'), (6, 'mobile.profile')`,
  );

  await dbConn.end();

  // eslint-disable-next-line no-console
  console.log(
    `Database initialized (schema, roles, menus; no sample data): ${process.env.DB_NAME || "fix_asset_db"}`,
  );
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize database:", error.message);
  process.exit(1);
});
