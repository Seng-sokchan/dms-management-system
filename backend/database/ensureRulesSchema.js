const { getPool } = require("./pool");

const ADMIN_MENU_SEED = [
  ["overview", 1, "admin", "view"],
  ["newOrder", 2, "admin", "view"],
  ["catalogs", 3, "admin", "manage"],
  ["items", 4, "admin", "manage"],
  ["customerItemPrices", 5, "admin", "manage"],
  ["customers", 6, "admin", "manage"],
  ["trackingCustomerLocation", 7, "admin", "view"],
  ["provinces", 8, "admin", "manage"],
  ["depots", 9, "admin", "manage"],
  ["customersByDepot", 10, "admin", "view"],
  ["producers", 11, "admin", "manage"],
  ["deliveryAgents", 12, "admin", "manage"],
  ["orders", 13, "admin", "view"],
  ["assignOrders", 14, "admin", "view"],
  ["orderMovement", 15, "admin", "view"],
  ["payments", 16, "admin", "view"],
  ["customerOrderHistory", 17, "admin", "view"],
  ["users", 18, "admin", "manage"],
  ["borrowedMaterials", 19, "admin", "manage"],
];

const MOBILE_MENU_SEED = [
  ["mobile.newOrder", 101, "mobile", "view"],
  ["mobile.myOrders", 102, "mobile", "view"],
  ["mobile.tracking", 103, "mobile", "view"],
  ["mobile.profile", 104, "mobile", "view"],
  ["mobile.live", 105, "mobile", "view"],
  ["mobile.prepareBatch", 106, "mobile", "view"],
  ["mobile.depotOrders", 107, "mobile", "view"],
];

const TRANSITION_SEED = [
  [1, 2],
  [2, 3],
  [3, 4],
];

const ROLE_DATA_SCOPE_SEED = {
  Admin: "all",
  Owner: "owner",
  Logistics: "none",
  Delivery: "delivery_agent",
  Customer: "customer",
  Depot: "depot",
};

const ROLE_CLIENT_SEED = {
  Admin: ["admin"],
  Owner: ["admin"],
  Logistics: ["admin"],
  Delivery: ["mobile"],
  Customer: ["mobile"],
  Depot: ["mobile"],
};

const ROLE_STATUS_PERMISSION_SEED = {
  Admin: {
    Owner_Preparing: ["update_status", "confirm_delivery"],
    Sent_To_Factory: ["update_status"],
    Ready_For_Delivery: ["update_status"],
    Recieve_By_Customer: ["update_status", "confirm_delivery"],
  },
  Owner: {
    Owner_Preparing: ["update_status"],
    Sent_To_Factory: ["update_status"],
    Ready_For_Delivery: ["update_status"],
  },
  Logistics: {
    Ready_For_Delivery: ["update_status"],
  },
  Delivery: {
    Ready_For_Delivery: ["update_status"],
    Recieve_By_Customer: ["update_status", "confirm_delivery"],
  },
};

const ROLE_SOCKET_CHANNEL_SEED = {
  Admin: ["delivery-locations-watcher"],
  Owner: ["delivery-locations-watcher"],
  Logistics: ["delivery-locations-watcher"],
  Depot: ["delivery-locations-watcher"],
};

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

async function ensureRulesSchema() {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    if (await tableExists(conn, "roles")) {
      if (!(await columnExists(conn, "roles", "data_scope"))) {
        await conn.query(
          "ALTER TABLE roles ADD COLUMN data_scope varchar(20) NOT NULL DEFAULT 'none' AFTER name",
        );
      }
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS menus (
        menu_key varchar(40) NOT NULL,
        sort_order smallint(5) unsigned NOT NULL DEFAULT '0',
        client varchar(10) NOT NULL DEFAULT 'admin',
        access_level varchar(10) NOT NULL DEFAULT 'view',
        is_active tinyint(1) NOT NULL DEFAULT '1',
        PRIMARY KEY (menu_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    if (await tableExists(conn, "menus")) {
      if (!(await columnExists(conn, "menus", "client"))) {
        await conn.query(
          "ALTER TABLE menus ADD COLUMN client varchar(10) NOT NULL DEFAULT 'admin' AFTER sort_order",
        );
      }
      if (!(await columnExists(conn, "menus", "access_level"))) {
        await conn.query(
          "ALTER TABLE menus ADD COLUMN access_level varchar(10) NOT NULL DEFAULT 'view' AFTER client",
        );
      }
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_clients (
        role_id int(10) unsigned NOT NULL,
        client varchar(10) NOT NULL,
        PRIMARY KEY (role_id, client),
        KEY idx_role_clients_client (client)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_status_permissions (
        role_id int(10) unsigned NOT NULL,
        to_status_id tinyint(3) unsigned NOT NULL,
        action varchar(30) NOT NULL DEFAULT 'update_status',
        PRIMARY KEY (role_id, to_status_id, action),
        KEY idx_rsp_to_status (to_status_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_socket_channels (
        role_id int(10) unsigned NOT NULL,
        channel_key varchar(60) NOT NULL,
        PRIMARY KEY (role_id, channel_key),
        KEY idx_rsc_channel (channel_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    if (!(await columnExists(conn, "status", "sort_order"))) {
      await conn.query(
        "ALTER TABLE status ADD COLUMN sort_order tinyint(3) unsigned NOT NULL DEFAULT '0' AFTER name",
      );
      await conn.query(
        "UPDATE status SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL",
      );
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS status_transitions (
        from_status_id tinyint(3) unsigned NOT NULL,
        to_status_id tinyint(3) unsigned NOT NULL,
        PRIMARY KEY (from_status_id, to_status_id),
        KEY idx_status_transitions_to (to_status_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    await conn.query("DROP VIEW IF EXISTS v_role_socket_channels");
    await conn.query("DROP VIEW IF EXISTS v_role_status_permissions");
    await conn.query("DROP VIEW IF EXISTS v_role_clients");
    await conn.query("DROP VIEW IF EXISTS v_menus");
    await conn.query("DROP VIEW IF EXISTS v_role_menus");
    await conn.query("DROP VIEW IF EXISTS v_roles");
    await conn.query("DROP VIEW IF EXISTS v_status_transitions");
    await conn.query("DROP VIEW IF EXISTS v_statuses");

    await conn.query(`
      CREATE VIEW v_roles AS
      SELECT id, name, data_scope FROM roles
    `);

    await conn.query(`
      CREATE VIEW v_menus AS
      SELECT menu_key, sort_order, client, access_level, is_active
      FROM menus WHERE is_active = 1
    `);

    await conn.query(`
      CREATE VIEW v_role_menus AS
      SELECT r.name AS role_name, rm.menu_key, rm.role_id, m.client, m.access_level
      FROM role_menus rm
      INNER JOIN roles r ON r.id = rm.role_id
      INNER JOIN menus m ON m.menu_key = rm.menu_key
    `);

    await conn.query(`
      CREATE VIEW v_role_clients AS
      SELECT r.name AS role_name, rc.role_id, rc.client
      FROM role_clients rc
      INNER JOIN roles r ON r.id = rc.role_id
    `);

    await conn.query(`
      CREATE VIEW v_role_status_permissions AS
      SELECT r.name AS role_name, rsp.role_id, rsp.to_status_id, s.name AS to_status, rsp.action
      FROM role_status_permissions rsp
      INNER JOIN roles r ON r.id = rsp.role_id
      INNER JOIN status s ON s.id = rsp.to_status_id
    `);

    await conn.query(`
      CREATE VIEW v_role_socket_channels AS
      SELECT r.name AS role_name, rsc.role_id, rsc.channel_key
      FROM role_socket_channels rsc
      INNER JOIN roles r ON r.id = rsc.role_id
    `);

    await conn.query(`
      CREATE VIEW v_statuses AS
      SELECT id, name, sort_order FROM status
    `);

    await conn.query(`
      CREATE VIEW v_status_transitions AS
      SELECT fs.name AS from_status, ts.name AS to_status, st.from_status_id, st.to_status_id
      FROM status_transitions st
      INNER JOIN status fs ON fs.id = st.from_status_id
      INNER JOIN status ts ON ts.id = st.to_status_id
    `);

    if (await tableExists(conn, "menus")) {
      const [menuRows] = await conn.query("SELECT COUNT(*) AS total FROM menus");
      if (Number(menuRows[0]?.total || 0) === 0) {
        for (const [menuKey, sortOrder, client, accessLevel] of [...ADMIN_MENU_SEED, ...MOBILE_MENU_SEED]) {
          await conn.query(
            "INSERT INTO menus (menu_key, sort_order, client, access_level) VALUES (?, ?, ?, ?)",
            [menuKey, sortOrder, client, accessLevel],
          );
        }
      } else {
        for (const [menuKey, sortOrder, client, accessLevel] of MOBILE_MENU_SEED) {
          await conn.query(
            "INSERT IGNORE INTO menus (menu_key, sort_order, client, access_level) VALUES (?, ?, ?, ?)",
            [menuKey, sortOrder, client, accessLevel],
          );
        }
        for (const [menuKey, , , accessLevel] of ADMIN_MENU_SEED) {
          if (accessLevel === "manage") {
            await conn.query("UPDATE menus SET access_level = ? WHERE menu_key = ?", [
              accessLevel,
              menuKey,
            ]);
          }
        }
      }
    }

    if (await tableExists(conn, "status_transitions")) {
      const [transitionRows] = await conn.query("SELECT COUNT(*) AS total FROM status_transitions");
      if (Number(transitionRows[0]?.total || 0) === 0) {
        for (const [fromId, toId] of TRANSITION_SEED) {
          await conn.query(
            "INSERT IGNORE INTO status_transitions (from_status_id, to_status_id) VALUES (?, ?)",
            [fromId, toId],
          );
        }
      }
    }

    if (await tableExists(conn, "roles")) {
      for (const [roleName, dataScope] of Object.entries(ROLE_DATA_SCOPE_SEED)) {
        await conn.query("UPDATE roles SET data_scope = ? WHERE name = ? AND data_scope = 'none'", [
          dataScope,
          roleName,
        ]);
      }
    }

    if (await tableExists(conn, "role_clients")) {
      const [clientRows] = await conn.query("SELECT COUNT(*) AS total FROM role_clients");
      if (Number(clientRows[0]?.total || 0) === 0) {
        const [roles] = await conn.query("SELECT id, name FROM roles");
        for (const role of roles) {
          const clients = ROLE_CLIENT_SEED[role.name] || [];
          for (const client of clients) {
            await conn.query("INSERT IGNORE INTO role_clients (role_id, client) VALUES (?, ?)", [
              role.id,
              client,
            ]);
          }
        }
      }
    }

    if (await tableExists(conn, "role_status_permissions")) {
      const [permRows] = await conn.query("SELECT COUNT(*) AS total FROM role_status_permissions");
      if (Number(permRows[0]?.total || 0) === 0) {
        const [roles] = await conn.query("SELECT id, name FROM roles");
        const [statuses] = await conn.query("SELECT id, name FROM status");
        const statusByName = Object.fromEntries(statuses.map((s) => [s.name, s.id]));
        for (const role of roles) {
          const perms = ROLE_STATUS_PERMISSION_SEED[role.name] || {};
          for (const [statusName, actions] of Object.entries(perms)) {
            const statusId = statusByName[statusName];
            if (!statusId) continue;
            for (const action of actions) {
              await conn.query(
                "INSERT IGNORE INTO role_status_permissions (role_id, to_status_id, action) VALUES (?, ?, ?)",
                [role.id, statusId, action],
              );
            }
          }
        }
      }
    }

    if (await tableExists(conn, "role_socket_channels")) {
      const [socketRows] = await conn.query("SELECT COUNT(*) AS total FROM role_socket_channels");
      if (Number(socketRows[0]?.total || 0) === 0) {
        const [roles] = await conn.query("SELECT id, name FROM roles");
        for (const role of roles) {
          const channels = ROLE_SOCKET_CHANNEL_SEED[role.name] || [];
          for (const channelKey of channels) {
            await conn.query(
              "INSERT IGNORE INTO role_socket_channels (role_id, channel_key) VALUES (?, ?)",
              [role.id, channelKey],
            );
          }
        }
      }
    }

    await seedMobileRoleMenus(conn);

    await conn.query("DROP PROCEDURE IF EXISTS sp_delete_all_status_transitions");
    await conn.query(`
      CREATE PROCEDURE sp_delete_all_status_transitions()
      DELETE FROM status_transitions
    `);
    await conn.query("DROP PROCEDURE IF EXISTS sp_add_status_transition");
    await conn.query(`
      CREATE PROCEDURE sp_add_status_transition(
        IN p_from_status_id TINYINT UNSIGNED,
        IN p_to_status_id TINYINT UNSIGNED
      )
      INSERT INTO status_transitions (from_status_id, to_status_id) VALUES (p_from_status_id, p_to_status_id)
    `);

    await conn.query("DROP PROCEDURE IF EXISTS sp_delete_role_clients_by_role_id");
    await conn.query(`
      CREATE PROCEDURE sp_delete_role_clients_by_role_id(IN p_role_id INT UNSIGNED)
      DELETE FROM role_clients WHERE role_id = p_role_id
    `);
    await conn.query("DROP PROCEDURE IF EXISTS sp_add_role_client");
    await conn.query(`
      CREATE PROCEDURE sp_add_role_client(IN p_role_id INT UNSIGNED, IN p_client VARCHAR(10))
      INSERT INTO role_clients (role_id, client) VALUES (p_role_id, p_client)
    `);

    await conn.query("DROP PROCEDURE IF EXISTS sp_delete_role_status_permissions_by_role_id");
    await conn.query(`
      CREATE PROCEDURE sp_delete_role_status_permissions_by_role_id(IN p_role_id INT UNSIGNED)
      DELETE FROM role_status_permissions WHERE role_id = p_role_id
    `);
    await conn.query("DROP PROCEDURE IF EXISTS sp_add_role_status_permission");
    await conn.query(`
      CREATE PROCEDURE sp_add_role_status_permission(
        IN p_role_id INT UNSIGNED,
        IN p_to_status_id TINYINT UNSIGNED,
        IN p_action VARCHAR(30)
      )
      INSERT INTO role_status_permissions (role_id, to_status_id, action) VALUES (p_role_id, p_to_status_id, p_action)
    `);

    await conn.query("DROP PROCEDURE IF EXISTS sp_delete_role_socket_channels_by_role_id");
    await conn.query(`
      CREATE PROCEDURE sp_delete_role_socket_channels_by_role_id(IN p_role_id INT UNSIGNED)
      DELETE FROM role_socket_channels WHERE role_id = p_role_id
    `);
    await conn.query("DROP PROCEDURE IF EXISTS sp_add_role_socket_channel");
    await conn.query(`
      CREATE PROCEDURE sp_add_role_socket_channel(IN p_role_id INT UNSIGNED, IN p_channel_key VARCHAR(60))
      INSERT INTO role_socket_channels (role_id, channel_key) VALUES (p_role_id, p_channel_key)
    `);
  } finally {
    conn.release();
  }
}

async function seedMobileRoleMenus(conn) {
  const MOBILE_ROLE_MENUS = {
    Customer: ["mobile.newOrder", "mobile.myOrders", "mobile.tracking", "mobile.profile"],
    Delivery: ["mobile.live", "mobile.profile"],
    Depot: ["mobile.prepareBatch", "mobile.depotOrders", "mobile.tracking", "mobile.profile"],
  };

  const [roles] = await conn.query("SELECT id, name FROM roles");
  for (const role of roles) {
    const menuKeys = MOBILE_ROLE_MENUS[role.name];
    if (!menuKeys) continue;
    for (const menuKey of menuKeys) {
      await conn.query("INSERT IGNORE INTO role_menus (role_id, menu_key) VALUES (?, ?)", [
        role.id,
        menuKey,
      ]);
    }
  }
}

module.exports = {
  ensureRulesSchema,
};
