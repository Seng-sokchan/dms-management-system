const { getPool } = require("./pool");

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function indexExists(conn, tableName, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName],
  );
  return rows.length > 0;
}

async function ensureDepotUserLinkOnUsers(conn) {
  if (!(await tableExists(conn, "users"))) return;

  const hadUsersDepotId = await columnExists(conn, "users", "depot_id");
  if (!hadUsersDepotId) {
    await conn.query(
      "ALTER TABLE users ADD COLUMN depot_id int(10) unsigned DEFAULT NULL AFTER delivery_agent_id",
    );
  }
  if (!(await indexExists(conn, "users", "uq_users_depot_id"))) {
    await conn.query("ALTER TABLE users ADD UNIQUE KEY uq_users_depot_id (depot_id)");
  }

  const hadDepotsDepotUserId = await columnExists(conn, "depots", "depot_user_id");
  if (hadDepotsDepotUserId) {
    await conn.query(`
      UPDATE users u
      INNER JOIN depots d ON d.depot_user_id = u.id
      SET u.depot_id = d.id
      WHERE u.depot_id IS NULL AND d.depot_user_id IS NOT NULL
    `);
    if (await indexExists(conn, "depots", "uq_depots_depot_user_id")) {
      await conn.query("ALTER TABLE depots DROP INDEX uq_depots_depot_user_id");
    }
    await conn.query("ALTER TABLE depots DROP COLUMN depot_user_id");
  }

  await conn.query("DROP VIEW IF EXISTS v_users");
  await conn.query(`
    CREATE VIEW v_users AS
    SELECT
      u.id,
      u.name,
      u.username,
      u.password_hash,
      r.name AS role,
      u.is_active,
      u.customer_id,
      u.delivery_agent_id,
      u.depot_id
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
  `);

  if (await tableExists(conn, "depots")) {
    await conn.query("DROP VIEW IF EXISTS v_depots");
    await conn.query(`
      CREATE VIEW v_depots AS
      SELECT
        d.id,
        d.name,
        d.phone,
        d.address,
        du.id AS depot_user_id,
        du.name AS depot_user_name,
        d.created_at
      FROM depots d
      LEFT JOIN users du ON du.depot_id = d.id AND du.is_active = 1
      WHERE d.is_active = 1
    `);
  }

  await conn.query("DROP PROCEDURE IF EXISTS sp_set_depot_user_link");
  await conn.query(`
    CREATE PROCEDURE sp_set_depot_user_link(IN p_depot_id INT UNSIGNED, IN p_user_id INT UNSIGNED)
    BEGIN
      IF p_user_id IS NULL THEN
        IF p_depot_id IS NOT NULL THEN
          UPDATE users SET depot_id = NULL WHERE depot_id = p_depot_id;
        END IF;
      ELSEIF p_depot_id IS NULL THEN
        UPDATE users SET depot_id = NULL WHERE id = p_user_id;
      ELSE
        UPDATE users SET depot_id = NULL WHERE id = p_user_id;
        UPDATE users SET depot_id = NULL WHERE depot_id = p_depot_id AND id <> p_user_id;
        UPDATE users SET depot_id = p_depot_id WHERE id = p_user_id;
      END IF;
    END
  `);

  await conn.query("DROP PROCEDURE IF EXISTS sp_create_depot");
  await conn.query(`
    CREATE PROCEDURE sp_create_depot(
      IN p_name VARCHAR(120),
      IN p_phone VARCHAR(30),
      IN p_address VARCHAR(255),
      IN p_updated_at DATETIME
    )
    BEGIN
      INSERT INTO depots (name, phone, address, updated_at)
      VALUES (p_name, p_phone, p_address, p_updated_at);
      SELECT LAST_INSERT_ID() AS insertId;
    END
  `);

  await conn.query("DROP PROCEDURE IF EXISTS sp_update_depot");
  await conn.query(`
    CREATE PROCEDURE sp_update_depot(
      IN p_id INT UNSIGNED,
      IN p_name VARCHAR(120),
      IN p_phone VARCHAR(30),
      IN p_address VARCHAR(255),
      IN p_updated_at DATETIME
    )
    BEGIN
      UPDATE depots
      SET name = p_name,
          phone = p_phone,
          address = p_address,
          updated_at = p_updated_at
      WHERE id = p_id AND is_active = 1;
      SELECT ROW_COUNT() AS affectedRows;
    END
  `);
}

async function dropLegacyRulesArtifacts(conn) {
  const dropViews = [
    "v_role_socket_channels",
    "v_role_status_permissions",
    "v_role_clients",
    "v_menus",
    "v_role_menus",
    "v_status_transitions",
  ];
  for (const viewName of dropViews) {
    await conn.query(`DROP VIEW IF EXISTS ${viewName}`);
  }

  const dropProcedures = [
    "sp_delete_all_status_transitions",
    "sp_add_status_transition",
    "sp_delete_role_menus_by_role_id",
    "sp_add_role_menu",
    "sp_delete_role_clients_by_role_id",
    "sp_add_role_client",
    "sp_delete_role_status_permissions_by_role_id",
    "sp_add_role_status_permission",
    "sp_delete_role_socket_channels_by_role_id",
    "sp_add_role_socket_channel",
  ];
  for (const procName of dropProcedures) {
    await conn.query(`DROP PROCEDURE IF EXISTS ${procName}`);
  }

  const dropTables = [
    "role_socket_channels",
    "role_status_permissions",
    "role_clients",
    "role_menus",
    "status_transitions",
    "menus",
  ];
  for (const tableName of dropTables) {
    await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
  }

  if (await tableExists(conn, "roles") && (await columnExists(conn, "roles", "data_scope"))) {
    await conn.query("ALTER TABLE roles DROP COLUMN data_scope");
  }

  await conn.query("DROP VIEW IF EXISTS v_roles");
  await conn.query(`
    CREATE VIEW v_roles AS
    SELECT id, name FROM roles
  `);

  if (!(await columnExists(conn, "status", "sort_order"))) {
    await conn.query(
      "ALTER TABLE status ADD COLUMN sort_order tinyint(3) unsigned NOT NULL DEFAULT '0' AFTER name",
    );
    await conn.query(
      "UPDATE status SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL",
    );
  }

  await conn.query("DROP VIEW IF EXISTS v_statuses");
  await conn.query(`
    CREATE VIEW v_statuses AS
    SELECT id, name, sort_order FROM status
  `);
}

async function dropLegacyDepotOwnerUser(conn) {
  if (!(await tableExists(conn, "depots"))) return;

  if (await columnExists(conn, "depots", "owner_user_id")) {
    if (await indexExists(conn, "depots", "idx_depots_owner_user_id")) {
      await conn.query("ALTER TABLE depots DROP INDEX idx_depots_owner_user_id");
    }
    await conn.query("ALTER TABLE depots DROP COLUMN owner_user_id");
  }

  await conn.query("DROP VIEW IF EXISTS v_depots");
  await conn.query(`
    CREATE VIEW v_depots AS
    SELECT
      d.id,
      d.name,
      d.phone,
      d.address,
      du.id AS depot_user_id,
      du.name AS depot_user_name,
      d.created_at
    FROM depots d
    LEFT JOIN users du ON du.depot_id = d.id AND du.is_active = 1
    WHERE d.is_active = 1
  `);

  if (await tableExists(conn, "customers")) {
    await conn.query("DROP VIEW IF EXISTS v_customers");
    await conn.query(`
      CREATE VIEW v_customers AS
      SELECT
        c.id,
        c.name,
        c.phone,
        u.id AS user_id,
        u.name AS user_name,
        u.username AS user_username,
        c.depot_id,
        d.name AS depot_name,
        c.province_id,
        p.name AS province_name,
        c.latitude,
        c.longitude,
        c.updated_at
      FROM customers c
      LEFT JOIN users u ON u.customer_id = c.id AND u.is_active = 1
      LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
      LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
      WHERE c.is_active = 1
    `);
  }

  await conn.query("DROP PROCEDURE IF EXISTS sp_create_depot");
  await conn.query(`
    CREATE PROCEDURE sp_create_depot(
      IN p_name VARCHAR(120),
      IN p_phone VARCHAR(30),
      IN p_address VARCHAR(255),
      IN p_updated_at DATETIME
    )
    BEGIN
      INSERT INTO depots (name, phone, address, updated_at)
      VALUES (p_name, p_phone, p_address, p_updated_at);
      SELECT LAST_INSERT_ID() AS insertId;
    END
  `);

  await conn.query("DROP PROCEDURE IF EXISTS sp_update_depot");
  await conn.query(`
    CREATE PROCEDURE sp_update_depot(
      IN p_id INT UNSIGNED,
      IN p_name VARCHAR(120),
      IN p_phone VARCHAR(30),
      IN p_address VARCHAR(255),
      IN p_updated_at DATETIME
    )
    BEGIN
      UPDATE depots
      SET name = p_name,
          phone = p_phone,
          address = p_address,
          updated_at = p_updated_at
      WHERE id = p_id AND is_active = 1;
      SELECT ROW_COUNT() AS affectedRows;
    END
  `);
}

async function ensureRulesSchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await ensureDepotUserLinkOnUsers(conn);
    await dropLegacyDepotOwnerUser(conn);
    await dropLegacyRulesArtifacts(conn);
  } finally {
    conn.release();
  }
}

module.exports = {
  ensureRulesSchema,
};
