SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS payment_statuses;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS catalogs;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS order_groups;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS trucks;
DROP TABLE IF EXISTS delivery_agents;
DROP TABLE IF EXISTS producers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_menus;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE role_menus (
  role_id INT UNSIGNED NOT NULL,
  menu_key VARCHAR(40) NOT NULL,
  PRIMARY KEY (role_id, menu_key),
  KEY idx_role_menus_key (menu_key),
  CONSTRAINT fk_role_menus_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role_id (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE user_activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED DEFAULT NULL,
  username VARCHAR(60) DEFAULT NULL,
  role VARCHAR(60) DEFAULT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status_code SMALLINT UNSIGNED NOT NULL,
  message VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_activity_logs_user (user_id),
  KEY idx_user_activity_logs_created_at (created_at),
  CONSTRAINT fk_user_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE producers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  capacity_note VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_producers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE delivery_agents (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  vehicle_type VARCHAR(60) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_delivery_agents_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE trucks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  plate_no VARCHAR(40) NOT NULL,
  delivery_agent_id INT UNSIGNED DEFAULT NULL,
  capacity_note VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trucks_code (code),
  UNIQUE KEY uq_trucks_plate_no (plate_no),
  KEY idx_trucks_code (code),
  KEY idx_trucks_delivery_agent (delivery_agent_id),
  CONSTRAINT fk_trucks_delivery_agent FOREIGN KEY (delivery_agent_id) REFERENCES delivery_agents (id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE order_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE addresses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  order_group_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_addresses_name (name),
  KEY idx_addresses_order_group_id (order_group_id),
  CONSTRAINT fk_addresses_order_group FOREIGN KEY (order_group_id) REFERENCES order_groups (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  address INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  sub_address VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_customers_name (name),
  KEY idx_customers_address (address),
  KEY idx_customers_user_id (user_id),
  CONSTRAINT fk_customers_address FOREIGN KEY (address) REFERENCES addresses (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE catalogs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  note VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_catalogs_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  catalog_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) DEFAULT '',
  default_unit_price_usd DECIMAL(14,2) NOT NULL,
  default_unit_price_khr DECIMAL(14,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_items_name (name),
  KEY idx_items_sku (sku),
  KEY idx_items_catalog (catalog_id),
  CONSTRAINT fk_items_catalog FOREIGN KEY (catalog_id) REFERENCES catalogs (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE status (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO status (id, name) VALUES
  (1, 'NEW_ORDER'),
  (2, 'OWNER_PREPARING'),
  (3, 'SENT_TO_LOGISTICS_SUPPLIER'),
  (4, 'SUPPLIER_ORDER_READY'),
  (5, 'OUT_FOR_DELIVERY'),
  (6, 'RECEIVED_BY_CUSTOMER');

CREATE TABLE payment_statuses (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_statuses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO payment_statuses (id, name) VALUES
  (1, 'UNPAID'),
  (2, 'PAID');

CREATE TABLE payment_methods (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_methods_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO payment_methods (id, name) VALUES
  (1, 'Cash'),
  (2, 'Bank transfer'),
  (3, 'Card');

CREATE TABLE orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  address INT UNSIGNED NOT NULL,
  order_group_id INT UNSIGNED DEFAULT NULL,
  item_id INT UNSIGNED NOT NULL,
  ordered_qty INT UNSIGNED NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  producer_id INT UNSIGNED DEFAULT NULL,
  truck_id INT UNSIGNED DEFAULT NULL,
  delivery_agent_id INT UNSIGNED DEFAULT NULL,
  delivery_time DATETIME NULL,
  delivered_qty INT UNSIGNED NOT NULL DEFAULT 0,
  loss_qty INT UNSIGNED NOT NULL DEFAULT 0,
  remaining_qty INT UNSIGNED NOT NULL DEFAULT 0,
  discrepancy INT NOT NULL DEFAULT 0,
  amount_total DECIMAL(14,2) NOT NULL,
  amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  delivery_proof_type ENUM('PHOTO', 'SIGNATURE', 'OTP') DEFAULT NULL,
  delivery_proof_value VARCHAR(255) DEFAULT NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_orders_status (status),
  KEY idx_orders_payment_status (payment_status),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_producer_id (producer_id),
  KEY idx_orders_truck_id (truck_id),
  KEY idx_orders_delivery_agent_id (delivery_agent_id),
  KEY idx_orders_customer_id (customer_id),
  KEY idx_orders_address (address),
  KEY idx_orders_order_group_id (order_group_id),
  KEY idx_orders_item_id (item_id),
  CONSTRAINT fk_orders_producer FOREIGN KEY (producer_id) REFERENCES producers (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_truck FOREIGN KEY (truck_id) REFERENCES trucks (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_delivery_agent FOREIGN KEY (delivery_agent_id) REFERENCES delivery_agents (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address FOREIGN KEY (address) REFERENCES addresses (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_order_group FOREIGN KEY (order_group_id) REFERENCES order_groups (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_item FOREIGN KEY (item_id) REFERENCES items (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_payment_status FOREIGN KEY (payment_status) REFERENCES payment_statuses (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_status FOREIGN KEY (status) REFERENCES status (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  method TINYINT UNSIGNED NOT NULL,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_order_created (order_id, created_at),
  KEY idx_payments_method (method),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_payments_method FOREIGN KEY (method) REFERENCES payment_methods (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE order_status_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED DEFAULT NULL,
  from_status TINYINT UNSIGNED DEFAULT NULL,
  to_status TINYINT UNSIGNED NOT NULL,
  changed_by_user_id INT UNSIGNED DEFAULT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note VARCHAR(255) DEFAULT '',
  PRIMARY KEY (id),
  KEY idx_order_status_history_order (order_id, changed_at),
  KEY idx_order_status_history_from_status (from_status),
  KEY idx_order_status_history_to_status (to_status),
  KEY idx_order_status_history_user (changed_by_user_id),
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_order_status_history_from_status FOREIGN KEY (from_status) REFERENCES status (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_order_status_history_to_status FOREIGN KEY (to_status) REFERENCES status (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP PROCEDURE IF EXISTS sp_list_orders;
DROP PROCEDURE IF EXISTS sp_get_order_by_id;
DROP PROCEDURE IF EXISTS sp_list_users;
DROP PROCEDURE IF EXISTS sp_get_user_by_username;
DROP PROCEDURE IF EXISTS sp_get_user_by_id;
DROP PROCEDURE IF EXISTS sp_get_role_id_by_name;
DROP PROCEDURE IF EXISTS sp_list_producers;
DROP PROCEDURE IF EXISTS sp_get_producer_by_id;
DROP PROCEDURE IF EXISTS sp_list_delivery_agents;
DROP PROCEDURE IF EXISTS sp_get_delivery_agent_by_id;
DROP PROCEDURE IF EXISTS sp_get_truck_by_id;
DROP PROCEDURE IF EXISTS sp_list_customers;
DROP PROCEDURE IF EXISTS sp_list_trucks;
DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
DROP PROCEDURE IF EXISTS sp_list_catalogs;
DROP PROCEDURE IF EXISTS sp_get_catalog_by_id;
DROP PROCEDURE IF EXISTS sp_list_items;
DROP PROCEDURE IF EXISTS sp_get_item_by_id;
DROP PROCEDURE IF EXISTS sp_list_statuses;
DROP PROCEDURE IF EXISTS sp_list_payments;
DROP PROCEDURE IF EXISTS sp_get_payment_by_id;
DROP PROCEDURE IF EXISTS sp_get_status_id_by_name;
DROP PROCEDURE IF EXISTS sp_get_payment_status_id_by_name;

CREATE PROCEDURE sp_get_user_by_username(IN p_username VARCHAR(60))
SELECT u.id, u.name, u.username, u.password_hash, r.name AS role
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.username = p_username AND u.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_get_user_by_id(IN p_id INT UNSIGNED)
SELECT u.id, u.name, u.username, r.name AS role, u.is_active
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_get_role_id_by_name(IN p_name VARCHAR(60))
SELECT id
FROM roles
WHERE name = p_name
LIMIT 1;

CREATE PROCEDURE sp_list_users()
SELECT u.id, u.name, u.username, r.name AS role, u.is_active
FROM users u
INNER JOIN roles r ON r.id = u.role_id
ORDER BY u.created_at DESC;

CREATE PROCEDURE sp_get_producer_by_id(IN p_id INT UNSIGNED)
SELECT id, name, phone, capacity_note
FROM producers
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_producers()
SELECT id, name, phone, capacity_note
FROM producers
WHERE is_active = 1
ORDER BY created_at DESC;

CREATE PROCEDURE sp_get_delivery_agent_by_id(IN p_id INT UNSIGNED)
SELECT id, name, phone, vehicle_type
FROM delivery_agents
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_delivery_agents()
SELECT id, name, phone, vehicle_type
FROM delivery_agents
WHERE is_active = 1
ORDER BY created_at DESC;

CREATE PROCEDURE sp_get_truck_by_id(IN p_id INT UNSIGNED)
SELECT t.id, t.code, t.plate_no, t.capacity_note, t.delivery_agent_id, d.name AS delivery_agent_name
FROM trucks t
LEFT JOIN delivery_agents d ON d.id = t.delivery_agent_id
WHERE t.id = p_id AND t.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_trucks()
SELECT t.id, t.code, t.plate_no, t.capacity_note, t.delivery_agent_id, d.name AS delivery_agent_name
FROM trucks t
LEFT JOIN delivery_agents d ON d.id = t.delivery_agent_id
WHERE t.is_active = 1
ORDER BY t.created_at DESC;

CREATE PROCEDURE sp_get_customer_by_id(IN p_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.sub_address
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
WHERE c.id = p_id AND c.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_customers()
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.sub_address
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
WHERE c.is_active = 1
ORDER BY c.name ASC;

CREATE PROCEDURE sp_get_catalog_by_id(IN p_id INT UNSIGNED)
SELECT id, name, note
FROM catalogs
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_catalogs()
SELECT id, name, note
FROM catalogs
WHERE is_active = 1
ORDER BY name ASC;

CREATE PROCEDURE sp_get_item_by_id(IN p_id INT UNSIGNED)
SELECT i.id, i.catalog_id, i.name, i.sku, i.default_unit_price_usd, i.default_unit_price_khr, c.name AS catalog_name
FROM items i
INNER JOIN catalogs c ON c.id = i.catalog_id
WHERE i.id = p_id AND i.is_active = 1 AND c.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_items()
SELECT i.id, i.catalog_id, i.name, i.sku, i.default_unit_price_usd, i.default_unit_price_khr, c.name AS catalog_name
FROM items i
INNER JOIN catalogs c ON c.id = i.catalog_id
WHERE i.is_active = 1 AND c.is_active = 1
ORDER BY c.name ASC, i.name ASC;

CREATE PROCEDURE sp_list_statuses()
SELECT id, name
FROM status
ORDER BY id ASC;

CREATE PROCEDURE sp_get_status_id_by_name(IN p_name VARCHAR(30))
SELECT id
FROM status
WHERE name = p_name
LIMIT 1;

CREATE PROCEDURE sp_get_payment_status_id_by_name(IN p_name VARCHAR(20))
SELECT id
FROM payment_statuses
WHERE name = p_name
LIMIT 1;

CREATE PROCEDURE sp_get_payment_by_id(IN p_id INT UNSIGNED)
SELECT
  p.id, p.order_id, p.amount, p.method, pm.name AS method_name, p.note, p.created_at
FROM payments p
INNER JOIN payment_methods pm ON pm.id = p.method
WHERE p.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_list_payments()
SELECT
  p.id, p.order_id, p.amount, p.method, pm.name AS method_name, p.note, p.created_at,
  oa.name AS order_customer_name,
  it.name AS order_item_name
FROM payments p
INNER JOIN payment_methods pm ON pm.id = p.method
LEFT JOIN orders o ON o.id = p.order_id
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN addresses oa ON oa.id = o.address
LEFT JOIN items it ON o.item_id = it.id
ORDER BY p.created_at DESC;

CREATE PROCEDURE sp_get_order_by_id(IN p_id INT UNSIGNED)
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, c.sub_address AS customer_sub_address, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, o.delivery_agent_id, o.delivery_time, o.delivered_qty, o.loss_qty, o.remaining_qty,
  o.discrepancy, o.amount_total, o.amount_paid, ps.name AS payment_status, o.delivery_proof_type, o.delivery_proof_value, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  d.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
INNER JOIN payment_statuses ps ON ps.id = o.payment_status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents d ON d.id = o.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
WHERE o.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_list_orders()
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, c.sub_address AS customer_sub_address, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, o.delivery_agent_id, o.delivery_time, o.delivered_qty, o.loss_qty, o.remaining_qty,
  o.discrepancy, o.amount_total, o.amount_paid, ps.name AS payment_status, o.delivery_proof_type, o.delivery_proof_value, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  d.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
INNER JOIN payment_statuses ps ON ps.id = o.payment_status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents d ON d.id = o.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
ORDER BY o.created_at DESC;

DROP PROCEDURE IF EXISTS sp_dashboard_totals;
CREATE PROCEDURE sp_dashboard_totals()
SELECT
  (SELECT COUNT(*) FROM orders) AS orders,
  (SELECT COUNT(*) FROM producers WHERE is_active = 1) AS producers,
  (SELECT COUNT(*) FROM delivery_agents WHERE is_active = 1) AS deliveryAgents,
  (SELECT COUNT(*) FROM payments) AS payments,
  COALESCE(SUM(amount_total), 0) AS totalRevenue,
  COALESCE(SUM(amount_paid), 0) AS totalCollected,
  COALESCE(SUM(CASE WHEN discrepancy > 0 THEN discrepancy ELSE 0 END), 0) AS totalDiscrepancy,
  COALESCE(SUM(loss_qty), 0) AS totalLossQty,
  COALESCE(SUM(remaining_qty), 0) AS totalRemainingQty
FROM orders;

-- ---------------------------------------------------------------------------
-- Legacy migration scripts consolidated here (single-file DB source)
-- ---------------------------------------------------------------------------

-- 1) Ensure role_menus table + baseline role->menu mappings exist
SET @has_role_menus := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'role_menus'
);
SET @sql_role_menus := IF(
  @has_role_menus = 0,
  'CREATE TABLE role_menus (
    role_id INT UNSIGNED NOT NULL,
    menu_key VARCHAR(40) NOT NULL,
    PRIMARY KEY (role_id, menu_key),
    KEY idx_role_menus_key (menu_key),
    CONSTRAINT fk_role_menus_role FOREIGN KEY (role_id) REFERENCES roles (id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_role_menus FROM @sql_role_menus;
EXECUTE stmt_role_menus;
DEALLOCATE PREPARE stmt_role_menus;

INSERT INTO role_menus (role_id, menu_key) VALUES
(1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customers'),
(1, 'producers'), (1, 'deliveryAgents'), (1, 'trucks'), (1, 'orders'), (1, 'ownerPreparing'), (1, 'payments'), (1, 'users'), (1, 'activityLogs'),
(2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customers'),
(2, 'producers'), (2, 'deliveryAgents'), (2, 'trucks'), (2, 'orders'), (2, 'ownerPreparing'), (2, 'payments'),
(3, 'overview'), (3, 'deliveryAgents'), (3, 'trucks'), (3, 'confirmOrders'),
(4, 'overview'), (4, 'confirmOrders'), (4, 'orders'),
(5, 'overview'), (5, 'orders')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

-- 2) Remove obsolete orders.producer_confirm_status if it still exists
SET @has_producer_confirm_status := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'producer_confirm_status'
);
SET @sql_drop_producer_confirm_status := IF(
  @has_producer_confirm_status > 0,
  'ALTER TABLE orders DROP COLUMN producer_confirm_status',
  'SELECT 1'
);
PREPARE stmt_drop_producer_confirm_status FROM @sql_drop_producer_confirm_status;
EXECUTE stmt_drop_producer_confirm_status;
DEALLOCATE PREPARE stmt_drop_producer_confirm_status;

-- 3) Ensure order_groups and addresses(order_group_id) exist (legacy compatibility)
SET @has_order_groups := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'order_groups'
);
SET @sql_create_order_groups := IF(
  @has_order_groups = 0,
  'CREATE TABLE order_groups (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_groups_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_order_groups FROM @sql_create_order_groups;
EXECUTE stmt_create_order_groups;
DEALLOCATE PREPARE stmt_create_order_groups;

SET @has_addresses_order_group_id_col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'addresses'
    AND column_name = 'order_group_id'
);
SET @sql_add_addresses_order_group_id_col := IF(
  @has_addresses_order_group_id_col = 0,
  'ALTER TABLE addresses ADD COLUMN order_group_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_addresses_order_group_id_col FROM @sql_add_addresses_order_group_id_col;
EXECUTE stmt_add_addresses_order_group_id_col;
DEALLOCATE PREPARE stmt_add_addresses_order_group_id_col;

SET @has_addresses_group_id_col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'addresses'
    AND column_name = 'group_id'
);
SET @sql_backfill_order_group_id := IF(
  @has_addresses_group_id_col > 0,
  'UPDATE addresses SET order_group_id = group_id WHERE order_group_id IS NULL',
  'SELECT 1'
);
PREPARE stmt_backfill_order_group_id FROM @sql_backfill_order_group_id;
EXECUTE stmt_backfill_order_group_id;
DEALLOCATE PREPARE stmt_backfill_order_group_id;

-- 4) Keep customers.address as INT relation to addresses
SET @has_customers_address_int := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'address'
    AND data_type IN ('int', 'bigint', 'smallint', 'mediumint', 'tinyint')
);
SET @sql_add_customers_address_int := IF(
  @has_customers_address_int = 0,
  'ALTER TABLE customers ADD COLUMN address INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_customers_address_int FROM @sql_add_customers_address_int;
EXECUTE stmt_add_customers_address_int;
DEALLOCATE PREPARE stmt_add_customers_address_int;

-- 5) Ensure orders.address exists and follows customers relation
SET @has_orders_address := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'address'
);
SET @sql_add_orders_address := IF(
  @has_orders_address = 0,
  'ALTER TABLE orders ADD COLUMN address INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_orders_address FROM @sql_add_orders_address;
EXECUTE stmt_add_orders_address;
DEALLOCATE PREPARE stmt_add_orders_address;

UPDATE orders o
INNER JOIN customers c ON c.id = o.customer_id
SET o.address = c.address
WHERE o.address IS NULL;

-- 6) Ensure orders.order_group_id exists
SET @has_orders_order_group_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'order_group_id'
);
SET @sql_add_orders_order_group_id := IF(
  @has_orders_order_group_id = 0,
  'ALTER TABLE orders ADD COLUMN order_group_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_orders_order_group_id FROM @sql_add_orders_order_group_id;
EXECUTE stmt_add_orders_order_group_id;
DEALLOCATE PREPARE stmt_add_orders_order_group_id;

-- 7) Ensure customers.user_id exists for linking customer users
SET @has_customers_user_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'user_id'
);
SET @sql_add_customers_user_id := IF(
  @has_customers_user_id = 0,
  'ALTER TABLE customers ADD COLUMN user_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_customers_user_id FROM @sql_add_customers_user_id;
EXECUTE stmt_add_customers_user_id;
DEALLOCATE PREPARE stmt_add_customers_user_id;

-- 8) Ensure dual-currency item prices exist for USD and KHR
SET @has_items_price_usd := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'items'
    AND column_name = 'default_unit_price_usd'
);
SET @has_items_price_khr := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'items'
    AND column_name = 'default_unit_price_khr'
);
SET @has_items_legacy_price := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'items'
    AND column_name = 'default_unit_price'
);

SET @sql_add_items_price_usd := IF(
  @has_items_price_usd = 0,
  'ALTER TABLE items ADD COLUMN default_unit_price_usd DECIMAL(14,2) NULL',
  'SELECT 1'
);
PREPARE stmt_add_items_price_usd FROM @sql_add_items_price_usd;
EXECUTE stmt_add_items_price_usd;
DEALLOCATE PREPARE stmt_add_items_price_usd;

SET @sql_add_items_price_khr := IF(
  @has_items_price_khr = 0,
  'ALTER TABLE items ADD COLUMN default_unit_price_khr DECIMAL(14,2) NULL',
  'SELECT 1'
);
PREPARE stmt_add_items_price_khr FROM @sql_add_items_price_khr;
EXECUTE stmt_add_items_price_khr;
DEALLOCATE PREPARE stmt_add_items_price_khr;

SET @sql_backfill_items_price_usd := IF(
  @has_items_legacy_price > 0,
  'UPDATE items SET default_unit_price_usd = default_unit_price WHERE default_unit_price_usd IS NULL',
  'SELECT 1'
);
PREPARE stmt_backfill_items_price_usd FROM @sql_backfill_items_price_usd;
EXECUTE stmt_backfill_items_price_usd;
DEALLOCATE PREPARE stmt_backfill_items_price_usd;

SET @sql_backfill_items_price_khr := IF(
  @has_items_legacy_price > 0,
  'UPDATE items SET default_unit_price_khr = ROUND(default_unit_price * 4100, 2) WHERE default_unit_price_khr IS NULL',
  'SELECT 1'
);
PREPARE stmt_backfill_items_price_khr FROM @sql_backfill_items_price_khr;
EXECUTE stmt_backfill_items_price_khr;
DEALLOCATE PREPARE stmt_backfill_items_price_khr;

SET @sql_set_items_price_usd_not_null := IF(
  @has_items_price_usd = 0,
  'ALTER TABLE items MODIFY COLUMN default_unit_price_usd DECIMAL(14,2) NOT NULL',
  'SELECT 1'
);
PREPARE stmt_set_items_price_usd_not_null FROM @sql_set_items_price_usd_not_null;
EXECUTE stmt_set_items_price_usd_not_null;
DEALLOCATE PREPARE stmt_set_items_price_usd_not_null;

SET @sql_set_items_price_khr_not_null := IF(
  @has_items_price_khr = 0,
  'ALTER TABLE items MODIFY COLUMN default_unit_price_khr DECIMAL(14,2) NOT NULL',
  'SELECT 1'
);
PREPARE stmt_set_items_price_khr_not_null FROM @sql_set_items_price_khr_not_null;
EXECUTE stmt_set_items_price_khr_not_null;
DEALLOCATE PREPARE stmt_set_items_price_khr_not_null;

SET FOREIGN_KEY_CHECKS = 1;
