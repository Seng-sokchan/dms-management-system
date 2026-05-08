SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS borrow_material_monthly_installments;
DROP TABLE IF EXISTS borrow_material_monthly_schedules;
DROP TABLE IF EXISTS borrow_material_order_loans;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS payment_statuses;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS catalogs;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS order_groups;
DROP TABLE IF EXISTS customer_borrowed_materials;
DROP TABLE IF EXISTS borrow_materials;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS depots;
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

CREATE TABLE depots (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  owner_user_id INT UNSIGNED NOT NULL,
  depot_user_id INT UNSIGNED DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_depots_depot_user_id (depot_user_id),
  KEY idx_depots_name (name),
  KEY idx_depots_owner_user_id (owner_user_id),
  CONSTRAINT fk_depots_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_depots_depot_user FOREIGN KEY (depot_user_id) REFERENCES users (id)
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_addresses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NULL DEFAULT NULL,
  phone VARCHAR(30) NULL DEFAULT NULL,
  address INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  depot_id INT UNSIGNED DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_customers_name (name),
  KEY idx_customers_address (address),
  KEY idx_customers_user_id (user_id),
  KEY idx_customers_depot_id (depot_id),
  CONSTRAINT fk_customers_address FOREIGN KEY (address) REFERENCES addresses (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_customers_depot FOREIGN KEY (depot_id) REFERENCES depots (id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE borrow_materials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(30) DEFAULT '',
  note VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_borrow_materials_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE customer_borrowed_materials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  qty INT UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cbm_customer_material (customer_id, material_id),
  KEY idx_cbm_customer (customer_id),
  KEY idx_cbm_material (material_id),
  CONSTRAINT fk_cbm_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_cbm_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
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

CREATE TABLE customer_item_prices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KHR',
  unit_price DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_item_currency (customer_id, item_id, currency),
  KEY idx_customer_item_prices_customer (customer_id),
  KEY idx_customer_item_prices_item (item_id),
  CONSTRAINT fk_customer_item_prices_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_customer_item_prices_item FOREIGN KEY (item_id) REFERENCES items (id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE status (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO status (id, name) VALUES
  (1, 'New_Order'),
  (2, 'Owner_Preparing'),
  (3, 'Ready_For_Delivery'),
  (4, 'Recieve_By_Customer');

CREATE TABLE orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  address INT UNSIGNED NOT NULL,
  order_group_id INT UNSIGNED DEFAULT NULL,
  item_id INT UNSIGNED NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KHR',
  ordered_qty INT UNSIGNED NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  producer_id INT UNSIGNED DEFAULT NULL,
  truck_id INT UNSIGNED DEFAULT NULL,
  delivery_time DATETIME NULL,
  amount_total DECIMAL(14,2) NOT NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_orders_status (status),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_producer_id (producer_id),
  KEY idx_orders_truck_id (truck_id),
  KEY idx_orders_customer_id (customer_id),
  KEY idx_orders_address (address),
  KEY idx_orders_order_group_id (order_group_id),
  KEY idx_orders_item_id (item_id),
  CONSTRAINT fk_orders_producer FOREIGN KEY (producer_id) REFERENCES producers (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_truck FOREIGN KEY (truck_id) REFERENCES trucks (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address FOREIGN KEY (address) REFERENCES addresses (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_order_group FOREIGN KEY (order_group_id) REFERENCES order_groups (id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_orders_item FOREIGN KEY (item_id) REFERENCES items (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_status FOREIGN KEY (status) REFERENCES status (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE borrow_material_order_loans (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  fixed_unit_price DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KHR',
  ordered_qty INT UNSIGNED NOT NULL,
  computed_line_total DECIMAL(14,2) NOT NULL,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bmol_order (order_id),
  KEY idx_bmol_customer (customer_id),
  KEY idx_bmol_material (material_id),
  CONSTRAINT fk_bmol_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_bmol_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_bmol_order FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE borrow_material_monthly_schedules (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KHR',
  total_period INT UNSIGNED NOT NULL,
  start_due_date DATE NOT NULL,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_bmms_customer (customer_id),
  KEY idx_bmms_material (material_id),
  CONSTRAINT fk_bmms_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_bmms_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE borrow_material_monthly_installments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  schedule_id INT UNSIGNED NOT NULL,
  period_no INT UNSIGNED NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(14,2) NOT NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=unpaid, 1=paid',
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bmmsi_schedule_period (schedule_id, period_no),
  KEY idx_bmmsi_schedule (schedule_id),
  CONSTRAINT fk_bmmsi_schedule FOREIGN KEY (schedule_id) REFERENCES borrow_material_monthly_schedules (id)
    ON UPDATE RESTRICT ON DELETE CASCADE
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
DROP PROCEDURE IF EXISTS sp_create_user;
DROP PROCEDURE IF EXISTS sp_update_user;
DROP PROCEDURE IF EXISTS sp_deactivate_user;
DROP PROCEDURE IF EXISTS sp_get_role_id_by_name;
DROP PROCEDURE IF EXISTS sp_list_producers;
DROP PROCEDURE IF EXISTS sp_get_producer_by_id;
DROP PROCEDURE IF EXISTS sp_list_delivery_agents;
DROP PROCEDURE IF EXISTS sp_get_delivery_agent_by_id;
DROP PROCEDURE IF EXISTS sp_get_truck_by_id;
DROP PROCEDURE IF EXISTS sp_list_customers;
DROP PROCEDURE IF EXISTS sp_list_customers_by_depot_id;
DROP PROCEDURE IF EXISTS sp_list_customers_by_owner_user_id;
DROP PROCEDURE IF EXISTS sp_list_trucks;
DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
DROP PROCEDURE IF EXISTS sp_list_depots;
DROP PROCEDURE IF EXISTS sp_get_depot_by_id;
DROP PROCEDURE IF EXISTS sp_get_depot_by_owner_user_id;
DROP PROCEDURE IF EXISTS sp_get_depot_by_depot_user_id;
DROP PROCEDURE IF EXISTS sp_list_depots_by_owner_user_id;
DROP PROCEDURE IF EXISTS sp_list_catalogs;
DROP PROCEDURE IF EXISTS sp_get_catalog_by_id;
DROP PROCEDURE IF EXISTS sp_list_items;
DROP PROCEDURE IF EXISTS sp_get_item_by_id;
DROP PROCEDURE IF EXISTS sp_list_statuses;
DROP PROCEDURE IF EXISTS sp_list_payments;
DROP PROCEDURE IF EXISTS sp_get_payment_by_id;
DROP PROCEDURE IF EXISTS sp_get_status_id_by_name;
DROP PROCEDURE IF EXISTS sp_get_payment_status_id_by_name;
DROP PROCEDURE IF EXISTS sp_list_payment_methods;
DROP PROCEDURE IF EXISTS sp_create_payment;
DROP PROCEDURE IF EXISTS sp_apply_payment_to_order;
DROP PROCEDURE IF EXISTS sp_list_addresses;
DROP PROCEDURE IF EXISTS sp_list_role_menu_keys_by_role_name;
DROP PROCEDURE IF EXISTS sp_list_roles;
DROP PROCEDURE IF EXISTS sp_list_role_menus;
DROP PROCEDURE IF EXISTS sp_delete_role_menus_by_role_id;
DROP PROCEDURE IF EXISTS sp_add_role_menu;
DROP PROCEDURE IF EXISTS sp_create_order;
DROP PROCEDURE IF EXISTS sp_update_order_assignment;
DROP PROCEDURE IF EXISTS sp_update_order_status;
DROP PROCEDURE IF EXISTS sp_insert_order_status_history;
DROP PROCEDURE IF EXISTS sp_confirm_order_delivery;
DROP PROCEDURE IF EXISTS sp_delete_order;
DROP PROCEDURE IF EXISTS sp_create_catalog;
DROP PROCEDURE IF EXISTS sp_update_catalog;
DROP PROCEDURE IF EXISTS sp_delete_catalog;
DROP PROCEDURE IF EXISTS sp_create_customer;
DROP PROCEDURE IF EXISTS sp_update_customer;
DROP PROCEDURE IF EXISTS sp_delete_customer;
DROP PROCEDURE IF EXISTS sp_create_delivery_agent;
DROP PROCEDURE IF EXISTS sp_update_delivery_agent;
DROP PROCEDURE IF EXISTS sp_delete_delivery_agent;
DROP PROCEDURE IF EXISTS sp_create_item;
DROP PROCEDURE IF EXISTS sp_update_item;
DROP PROCEDURE IF EXISTS sp_delete_item;
DROP PROCEDURE IF EXISTS sp_list_order_groups;
DROP PROCEDURE IF EXISTS sp_get_order_group_by_id;
DROP PROCEDURE IF EXISTS sp_create_order_group;
DROP PROCEDURE IF EXISTS sp_update_order_group;
DROP PROCEDURE IF EXISTS sp_delete_order_group;
DROP PROCEDURE IF EXISTS sp_list_dashboard_status_summary;
DROP PROCEDURE IF EXISTS sp_list_dashboard_payment_summary;
DROP PROCEDURE IF EXISTS sp_dashboard_currency_totals;
DROP PROCEDURE IF EXISTS sp_create_producer;
DROP PROCEDURE IF EXISTS sp_update_producer;
DROP PROCEDURE IF EXISTS sp_delete_producer;
DROP PROCEDURE IF EXISTS sp_create_truck;
DROP PROCEDURE IF EXISTS sp_update_truck;
DROP PROCEDURE IF EXISTS sp_delete_truck;
DROP PROCEDURE IF EXISTS sp_create_depot;
DROP PROCEDURE IF EXISTS sp_update_depot;
DROP PROCEDURE IF EXISTS sp_delete_depot;
DROP PROCEDURE IF EXISTS sp_list_borrow_materials;
DROP PROCEDURE IF EXISTS sp_get_borrow_material_by_id;
DROP PROCEDURE IF EXISTS sp_create_borrow_material;
DROP PROCEDURE IF EXISTS sp_update_borrow_material;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material;
DROP PROCEDURE IF EXISTS sp_list_customer_borrowed_materials;
DROP PROCEDURE IF EXISTS sp_list_all_customer_borrowed_materials;
DROP PROCEDURE IF EXISTS sp_upsert_customer_borrowed_material;
DROP PROCEDURE IF EXISTS sp_delete_customer_borrowed_material;
DROP PROCEDURE IF EXISTS sp_list_customer_item_prices;
DROP PROCEDURE IF EXISTS sp_get_customer_item_price;
DROP PROCEDURE IF EXISTS sp_upsert_customer_item_price;
DROP PROCEDURE IF EXISTS sp_delete_customer_item_price;
DROP PROCEDURE IF EXISTS sp_list_all_borrow_material_order_loans;
DROP PROCEDURE IF EXISTS sp_create_borrow_material_order_loan;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material_order_loan;
DROP PROCEDURE IF EXISTS sp_list_all_borrow_material_monthly_schedules;
DROP PROCEDURE IF EXISTS sp_get_borrow_material_monthly_schedule_by_id;
DROP PROCEDURE IF EXISTS sp_list_borrow_material_monthly_installments;
DROP PROCEDURE IF EXISTS sp_create_borrow_material_monthly_schedule;
DROP PROCEDURE IF EXISTS sp_update_borrow_material_monthly_installment_status;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material_monthly_schedule;

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
ORDER BY u.id DESC;

CREATE PROCEDURE sp_create_user(
  IN p_name VARCHAR(255),
  IN p_username VARCHAR(60),
  IN p_password_hash VARCHAR(255),
  IN p_role_id INT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO users (name, username, password_hash, role_id, is_active, updated_at)
  VALUES (p_name, p_username, p_password_hash, p_role_id, 1, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_user(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(255),
  IN p_username VARCHAR(60),
  IN p_role_id INT UNSIGNED,
  IN p_password_hash VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE users
  SET name = COALESCE(p_name, name),
      username = COALESCE(p_username, username),
      role_id = COALESCE(p_role_id, role_id),
      password_hash = COALESCE(p_password_hash, password_hash),
      updated_at = p_updated_at
  WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_deactivate_user(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE users
  SET is_active = 0, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_get_producer_by_id(IN p_id INT UNSIGNED)
SELECT id, name, phone, capacity_note
FROM producers
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_producers()
SELECT id, name, phone, capacity_note
FROM producers
WHERE is_active = 1
ORDER BY id DESC;

CREATE PROCEDURE sp_get_delivery_agent_by_id(IN p_id INT UNSIGNED)
SELECT id, name, phone, vehicle_type
FROM delivery_agents
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_delivery_agents()
SELECT id, name, phone, vehicle_type
FROM delivery_agents
WHERE is_active = 1
ORDER BY id DESC;

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
ORDER BY t.id DESC;

CREATE PROCEDURE sp_get_depot_by_id(IN p_id INT UNSIGNED)
SELECT d.id, d.name, d.phone, d.address, d.owner_user_id, ou.name AS owner_user_name, d.depot_user_id, du.name AS depot_user_name
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
WHERE d.id = p_id AND d.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_get_depot_by_owner_user_id(IN p_owner_user_id INT UNSIGNED)
SELECT d.id, d.name, d.phone, d.address, d.owner_user_id, ou.name AS owner_user_name, d.depot_user_id, du.name AS depot_user_name
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
WHERE d.owner_user_id = p_owner_user_id AND d.is_active = 1
ORDER BY d.created_at DESC
LIMIT 1;

CREATE PROCEDURE sp_list_depots_by_owner_user_id(IN p_owner_user_id INT UNSIGNED)
SELECT d.id, d.name, d.phone, d.address, d.owner_user_id, ou.name AS owner_user_name, d.depot_user_id, du.name AS depot_user_name
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
WHERE d.owner_user_id = p_owner_user_id AND d.is_active = 1
ORDER BY d.id DESC;

CREATE PROCEDURE sp_get_depot_by_depot_user_id(IN p_depot_user_id INT UNSIGNED)
SELECT d.id, d.name, d.phone, d.address, d.owner_user_id, ou.name AS owner_user_name, d.depot_user_id, du.name AS depot_user_name
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
WHERE d.depot_user_id = p_depot_user_id AND d.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_depots()
SELECT d.id, d.name, d.phone, d.address, d.owner_user_id, ou.name AS owner_user_name, d.depot_user_id, du.name AS depot_user_name
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
WHERE d.is_active = 1
ORDER BY d.id DESC;

CREATE PROCEDURE sp_get_customer_by_id(IN p_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.id = p_id AND c.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_customers()
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.is_active = 1
ORDER BY c.id DESC;

CREATE PROCEDURE sp_list_customers_by_depot_id(IN p_depot_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
INNER JOIN depots d ON d.id = c.depot_id
WHERE c.is_active = 1 AND d.is_active = 1 AND c.depot_id = p_depot_id
ORDER BY c.id DESC;

CREATE PROCEDURE sp_list_customers_by_owner_user_id(IN p_owner_user_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, c.user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.is_active = 1
  AND (
    c.depot_id IS NULL
    OR d.owner_user_id = p_owner_user_id
  )
ORDER BY c.id DESC;

CREATE PROCEDURE sp_get_catalog_by_id(IN p_id INT UNSIGNED)
SELECT id, name, note
FROM catalogs
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_catalogs()
SELECT id, name, note
FROM catalogs
WHERE is_active = 1
ORDER BY id DESC;

CREATE PROCEDURE sp_get_item_by_id(IN p_id INT UNSIGNED)
SELECT i.id, i.catalog_id, i.name, i.sku, c.name AS catalog_name
FROM items i
INNER JOIN catalogs c ON c.id = i.catalog_id
WHERE i.id = p_id AND i.is_active = 1 AND c.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_items()
SELECT i.id, i.catalog_id, i.name, i.sku, c.name AS catalog_name
FROM items i
INNER JOIN catalogs c ON c.id = i.catalog_id
WHERE i.is_active = 1 AND c.is_active = 1
ORDER BY i.id DESC;

CREATE PROCEDURE sp_list_customer_item_prices()
SELECT
  cip.id,
  cip.customer_id,
  c.name AS customer_name,
  cip.item_id,
  i.name AS item_name,
  i.sku AS item_sku,
  cip.currency,
  cip.unit_price,
  cip.created_at,
  cip.updated_at
FROM customer_item_prices cip
INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1
INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1
ORDER BY cip.id DESC;

CREATE PROCEDURE sp_get_customer_item_price(
  IN p_customer_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_currency VARCHAR(10)
)
SELECT
  cip.id,
  cip.customer_id,
  c.name AS customer_name,
  cip.item_id,
  i.name AS item_name,
  i.sku AS item_sku,
  cip.currency,
  cip.unit_price,
  cip.created_at,
  cip.updated_at
FROM customer_item_prices cip
INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1
INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1
WHERE cip.customer_id = p_customer_id
  AND cip.item_id = p_item_id
  AND cip.currency = p_currency
LIMIT 1;

CREATE PROCEDURE sp_upsert_customer_item_price(
  IN p_customer_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_currency VARCHAR(10),
  IN p_unit_price DECIMAL(14,2),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customer_item_prices (customer_id, item_id, currency, unit_price, updated_at)
  VALUES (p_customer_id, p_item_id, p_currency, p_unit_price, p_updated_at)
  ON DUPLICATE KEY UPDATE
    unit_price = VALUES(unit_price),
    updated_at = VALUES(updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_delete_customer_item_price(IN p_id INT UNSIGNED)
BEGIN
  DELETE FROM customer_item_prices WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_statuses()
SELECT id, name
FROM status
ORDER BY id DESC;

CREATE PROCEDURE sp_list_addresses()
SELECT a.id, a.name
FROM addresses a
ORDER BY a.id DESC;

CREATE PROCEDURE sp_get_status_id_by_name(IN p_name VARCHAR(30))
SELECT id
FROM status
WHERE name = p_name
LIMIT 1;

CREATE PROCEDURE sp_get_order_by_id(IN p_id INT UNSIGNED)
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.currency, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, da.id AS delivery_agent_id, o.delivery_time,
  o.amount_total, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents da ON da.id = t.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
WHERE o.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_list_orders()
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.currency, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, da.id AS delivery_agent_id, o.delivery_time,
  o.amount_total, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents da ON da.id = t.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
ORDER BY o.id DESC;

CREATE PROCEDURE sp_create_order(
  IN p_customer_id INT UNSIGNED,
  IN p_address INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_ordered_qty DECIMAL(12,2),
  IN p_unit_price DECIMAL(12,2),
  IN p_currency VARCHAR(10),
  IN p_producer_id INT UNSIGNED,
  IN p_truck_id INT UNSIGNED,
  IN p_amount_total DECIMAL(12,2),
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO orders (
    customer_id, address, order_group_id, item_id, currency, ordered_qty, unit_price, producer_id, truck_id, delivery_time,
    amount_total, status, updated_at
  )
  VALUES (
    p_customer_id, p_address, NULL, p_item_id, p_currency, p_ordered_qty, p_unit_price, p_producer_id, p_truck_id, NULL,
    p_amount_total, p_status, p_updated_at
  );
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_order_assignment(
  IN p_id INT UNSIGNED,
  IN p_producer_id INT UNSIGNED,
  IN p_truck_id INT UNSIGNED,
  IN p_order_group_id INT UNSIGNED,
  IN p_delivery_time DATETIME,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE orders
SET producer_id = COALESCE(p_producer_id, producer_id),
    truck_id = COALESCE(p_truck_id, truck_id),
    order_group_id = COALESCE(p_order_group_id, order_group_id),
    delivery_time = COALESCE(p_delivery_time, delivery_time),
    status = COALESCE(p_status, status),
    updated_at = p_updated_at
WHERE id = p_id;

CREATE PROCEDURE sp_update_order_status(
  IN p_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE orders
SET status = p_status, updated_at = p_updated_at
WHERE id = p_id;

CREATE PROCEDURE sp_insert_order_status_history(
  IN p_order_id INT UNSIGNED,
  IN p_from_status TINYINT UNSIGNED,
  IN p_to_status TINYINT UNSIGNED,
  IN p_changed_by_user_id INT UNSIGNED,
  IN p_note VARCHAR(255)
)
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id, note)
VALUES (p_order_id, p_from_status, p_to_status, p_changed_by_user_id, p_note);

CREATE PROCEDURE sp_confirm_order_delivery(
  IN p_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE orders
SET status = p_status,
    updated_at = p_updated_at
WHERE id = p_id;

CREATE PROCEDURE sp_delete_order(IN p_id INT UNSIGNED)
BEGIN
  DELETE FROM orders WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_role_menu_keys_by_role_name(IN p_role_name VARCHAR(60))
SELECT rm.menu_key
FROM role_menus rm
INNER JOIN roles r ON r.id = rm.role_id
WHERE r.name = p_role_name
ORDER BY rm.menu_key DESC;

CREATE PROCEDURE sp_list_roles()
SELECT id, name FROM roles ORDER BY id DESC;

CREATE PROCEDURE sp_list_role_menus()
SELECT r.name AS role_name, rm.menu_key
FROM role_menus rm
INNER JOIN roles r ON r.id = rm.role_id
ORDER BY rm.role_id DESC, rm.menu_key DESC;

CREATE PROCEDURE sp_delete_role_menus_by_role_id(IN p_role_id INT UNSIGNED)
DELETE FROM role_menus WHERE role_id = p_role_id;

CREATE PROCEDURE sp_add_role_menu(IN p_role_id INT UNSIGNED, IN p_menu_key VARCHAR(40))
INSERT INTO role_menus (role_id, menu_key) VALUES (p_role_id, p_menu_key);

CREATE PROCEDURE sp_create_catalog(IN p_name VARCHAR(255), IN p_note VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  INSERT INTO catalogs (name, note, updated_at) VALUES (p_name, p_note, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_catalog(IN p_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_note VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  UPDATE catalogs SET name = p_name, note = p_note, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_catalog(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE catalogs SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_create_customer(
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_address INT UNSIGNED,
  IN p_user_id INT UNSIGNED,
  IN p_depot_id INT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customers (name, phone, address, user_id, depot_id, updated_at)
  VALUES (p_name, p_phone, p_address, p_user_id, p_depot_id, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_customer(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_address INT UNSIGNED,
  IN p_user_id INT UNSIGNED,
  IN p_depot_id INT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE customers
  SET name = p_name, phone = p_phone, address = p_address, user_id = p_user_id, depot_id = p_depot_id, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_create_depot(
  IN p_name VARCHAR(120),
  IN p_phone VARCHAR(30),
  IN p_address VARCHAR(255),
  IN p_owner_user_id INT UNSIGNED,
  IN p_depot_user_id INT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO depots (name, phone, address, owner_user_id, depot_user_id, updated_at)
  VALUES (p_name, p_phone, p_address, p_owner_user_id, p_depot_user_id, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_depot(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(120),
  IN p_phone VARCHAR(30),
  IN p_address VARCHAR(255),
  IN p_owner_user_id INT UNSIGNED,
  IN p_depot_user_id INT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE depots
  SET name = p_name,
      phone = p_phone,
      address = p_address,
      owner_user_id = p_owner_user_id,
      depot_user_id = p_depot_user_id,
      updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_depot(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE depots SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_customer(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE customers SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_create_delivery_agent(
  IN p_name VARCHAR(255), IN p_phone VARCHAR(30), IN p_vehicle_type VARCHAR(60), IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO delivery_agents (name, phone, vehicle_type, updated_at)
  VALUES (p_name, p_phone, p_vehicle_type, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_delivery_agent(
  IN p_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_phone VARCHAR(30), IN p_vehicle_type VARCHAR(60), IN p_updated_at DATETIME
)
BEGIN
  UPDATE delivery_agents
  SET name = p_name, phone = p_phone, vehicle_type = p_vehicle_type, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_delivery_agent(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE delivery_agents SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_create_item(
  IN p_catalog_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_sku VARCHAR(80), IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO items (catalog_id, name, sku, updated_at)
  VALUES (p_catalog_id, p_name, p_sku, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_item(
  IN p_id INT UNSIGNED, IN p_catalog_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_sku VARCHAR(80), IN p_updated_at DATETIME
)
BEGIN
  UPDATE items
  SET catalog_id = p_catalog_id, name = p_name, sku = p_sku, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_item(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE items SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_order_groups()
SELECT id, name FROM order_groups ORDER BY id DESC;

CREATE PROCEDURE sp_get_order_group_by_id(IN p_id INT UNSIGNED)
SELECT id, name FROM order_groups WHERE id = p_id LIMIT 1;

CREATE PROCEDURE sp_create_order_group(IN p_name VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  INSERT INTO order_groups (name, updated_at) VALUES (p_name, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_order_group(IN p_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  UPDATE order_groups SET name = p_name, updated_at = p_updated_at WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_order_group(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE order_groups SET updated_at = p_updated_at WHERE id = p_id;
  DELETE FROM order_groups WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_dashboard_status_summary()
SELECT s.name AS status, COUNT(*) AS total
FROM orders o
INNER JOIN status s ON s.id = o.status
GROUP BY s.name;

CREATE PROCEDURE sp_dashboard_currency_totals()
SELECT
  COALESCE(SUM(o.amount_total), 0) AS total_revenue_khr,
  0 AS total_collected_khr
FROM orders o
;

CREATE PROCEDURE sp_create_producer(IN p_name VARCHAR(255), IN p_phone VARCHAR(30), IN p_capacity_note VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  INSERT INTO producers (name, phone, capacity_note, updated_at) VALUES (p_name, p_phone, p_capacity_note, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_producer(IN p_id INT UNSIGNED, IN p_name VARCHAR(255), IN p_phone VARCHAR(30), IN p_capacity_note VARCHAR(255), IN p_updated_at DATETIME)
BEGIN
  UPDATE producers SET name = p_name, phone = p_phone, capacity_note = p_capacity_note, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_producer(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE producers SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_create_truck(
  IN p_code VARCHAR(80), IN p_plate_no VARCHAR(30), IN p_delivery_agent_id INT UNSIGNED, IN p_capacity_note VARCHAR(255), IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO trucks (code, plate_no, delivery_agent_id, capacity_note, updated_at)
  VALUES (p_code, p_plate_no, p_delivery_agent_id, p_capacity_note, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_truck(
  IN p_id INT UNSIGNED, IN p_code VARCHAR(80), IN p_plate_no VARCHAR(30), IN p_delivery_agent_id INT UNSIGNED, IN p_capacity_note VARCHAR(255), IN p_updated_at DATETIME
)
BEGIN
  UPDATE trucks
  SET code = p_code, plate_no = p_plate_no, delivery_agent_id = p_delivery_agent_id, capacity_note = p_capacity_note, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_truck(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE trucks SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_borrow_materials()
SELECT id, name, unit, note
FROM borrow_materials
WHERE is_active = 1
ORDER BY id DESC;

CREATE PROCEDURE sp_get_borrow_material_by_id(IN p_id INT UNSIGNED)
SELECT id, name, unit, note
FROM borrow_materials
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_create_borrow_material(
  IN p_name VARCHAR(120),
  IN p_unit VARCHAR(30),
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO borrow_materials (name, unit, note, updated_at)
  VALUES (p_name, p_unit, p_note, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_borrow_material(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(120),
  IN p_unit VARCHAR(30),
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE borrow_materials
  SET name = p_name, unit = p_unit, note = p_note, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_borrow_material(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE borrow_materials SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_customer_borrowed_materials(IN p_customer_id INT UNSIGNED)
SELECT cbm.id, cbm.customer_id, c.name AS customer_name, cbm.material_id, m.name AS material_name, m.unit, cbm.qty, cbm.note, cbm.created_at, cbm.updated_at
FROM customer_borrowed_materials cbm
INNER JOIN borrow_materials m ON m.id = cbm.material_id
INNER JOIN customers c ON c.id = cbm.customer_id
WHERE cbm.customer_id = p_customer_id AND m.is_active = 1 AND c.is_active = 1
ORDER BY cbm.id DESC;

CREATE PROCEDURE sp_list_all_customer_borrowed_materials()
SELECT cbm.id, cbm.customer_id, c.name AS customer_name, cbm.material_id, m.name AS material_name, m.unit, cbm.qty, cbm.note, cbm.created_at, cbm.updated_at
FROM customer_borrowed_materials cbm
INNER JOIN borrow_materials m ON m.id = cbm.material_id
INNER JOIN customers c ON c.id = cbm.customer_id
WHERE m.is_active = 1 AND c.is_active = 1
ORDER BY cbm.id DESC;

CREATE PROCEDURE sp_upsert_customer_borrowed_material(
  IN p_customer_id INT UNSIGNED,
  IN p_material_id INT UNSIGNED,
  IN p_qty INT UNSIGNED,
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customer_borrowed_materials (customer_id, material_id, qty, note, updated_at)
  VALUES (p_customer_id, p_material_id, p_qty, p_note, p_updated_at)
  ON DUPLICATE KEY UPDATE qty = VALUES(qty), note = VALUES(note), updated_at = VALUES(updated_at);
  SELECT id FROM customer_borrowed_materials WHERE customer_id = p_customer_id AND material_id = p_material_id LIMIT 1;
END;

CREATE PROCEDURE sp_delete_customer_borrowed_material(
  IN p_customer_id INT UNSIGNED,
  IN p_material_id INT UNSIGNED
)
BEGIN
  DELETE FROM customer_borrowed_materials WHERE customer_id = p_customer_id AND material_id = p_material_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_all_borrow_material_order_loans()
SELECT
  l.id, l.customer_id, c.name AS customer_name, l.material_id, m.name AS material_name, m.unit,
  l.order_id, l.fixed_unit_price, l.currency, l.ordered_qty, l.computed_line_total, l.note, l.created_at, l.updated_at
FROM borrow_material_order_loans l
INNER JOIN customers c ON c.id = l.customer_id
INNER JOIN borrow_materials m ON m.id = l.material_id
WHERE c.is_active = 1 AND m.is_active = 1
ORDER BY l.id DESC;

CREATE PROCEDURE sp_create_borrow_material_order_loan(
  IN p_customer_id INT UNSIGNED,
  IN p_material_id INT UNSIGNED,
  IN p_order_id INT UNSIGNED,
  IN p_fixed_unit_price DECIMAL(14,2),
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  DECLARE v_ordered_qty INT UNSIGNED;
  DECLARE v_currency VARCHAR(10);
  DECLARE v_cust INT UNSIGNED;
  DECLARE v_computed DECIMAL(14,2);
  SELECT ordered_qty, currency, customer_id INTO v_ordered_qty, v_currency, v_cust
  FROM orders WHERE id = p_order_id LIMIT 1;
  IF v_cust IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found';
  END IF;
  IF v_cust <> p_customer_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order customer mismatch';
  END IF;
  SET v_computed = ROUND(v_ordered_qty * p_fixed_unit_price, 2);
  INSERT INTO borrow_material_order_loans (
    customer_id, material_id, order_id, fixed_unit_price, currency, ordered_qty, computed_line_total, note, updated_at
  )
  VALUES (
    p_customer_id, p_material_id, p_order_id, p_fixed_unit_price, v_currency, v_ordered_qty, v_computed, p_note, p_updated_at
  );
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_delete_borrow_material_order_loan(IN p_id INT UNSIGNED, IN p_customer_id INT UNSIGNED)
BEGIN
  DELETE FROM borrow_material_order_loans WHERE id = p_id AND customer_id = p_customer_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_list_all_borrow_material_monthly_schedules()
SELECT
  s.id, s.customer_id, c.name AS customer_name, s.material_id, m.name AS material_name, m.unit,
  s.total_amount, s.currency, s.total_period, s.start_due_date, s.note, s.created_at, s.updated_at
FROM borrow_material_monthly_schedules s
INNER JOIN customers c ON c.id = s.customer_id
INNER JOIN borrow_materials m ON m.id = s.material_id
WHERE c.is_active = 1 AND m.is_active = 1
ORDER BY s.id DESC;

CREATE PROCEDURE sp_get_borrow_material_monthly_schedule_by_id(
  IN p_schedule_id INT UNSIGNED,
  IN p_customer_id INT UNSIGNED
)
SELECT
  s.id, s.customer_id, c.name AS customer_name, s.material_id, m.name AS material_name, m.unit,
  s.total_amount, s.currency, s.total_period, s.start_due_date, s.note, s.created_at, s.updated_at
FROM borrow_material_monthly_schedules s
INNER JOIN customers c ON c.id = s.customer_id
INNER JOIN borrow_materials m ON m.id = s.material_id
WHERE s.id = p_schedule_id AND s.customer_id = p_customer_id
LIMIT 1;

CREATE PROCEDURE sp_list_borrow_material_monthly_installments(IN p_schedule_id INT UNSIGNED)
SELECT id, schedule_id, period_no, due_date, amount_due, status, paid_at, created_at, updated_at
FROM borrow_material_monthly_installments
WHERE schedule_id = p_schedule_id
ORDER BY id DESC;

CREATE PROCEDURE sp_create_borrow_material_monthly_schedule(
  IN p_customer_id INT UNSIGNED,
  IN p_material_id INT UNSIGNED,
  IN p_total_amount DECIMAL(14,2),
  IN p_currency VARCHAR(10),
  IN p_total_period INT UNSIGNED,
  IN p_start_due_date DATE,
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  DECLARE v_schedule_id INT UNSIGNED;
  DECLARE v_i INT UNSIGNED DEFAULT 1;
  DECLARE v_per DECIMAL(14,2);
  DECLARE v_last DECIMAL(14,2);
  DECLARE v_due DATE;
  DECLARE v_amt DECIMAL(14,2);
  IF p_total_period < 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'total_period must be at least 1';
  END IF;
  INSERT INTO borrow_material_monthly_schedules (
    customer_id, material_id, total_amount, currency, total_period, start_due_date, note, updated_at
  )
  VALUES (
    p_customer_id, p_material_id, p_total_amount, p_currency, p_total_period, p_start_due_date, p_note, p_updated_at
  );
  SET v_schedule_id = LAST_INSERT_ID();
  SET v_per = TRUNCATE(p_total_amount / p_total_period, 2);
  SET v_last = p_total_amount - v_per * (p_total_period - 1);
  WHILE v_i <= p_total_period DO
    SET v_due = DATE_ADD(p_start_due_date, INTERVAL (v_i - 1) MONTH);
    IF v_i = p_total_period THEN
      SET v_amt = v_last;
    ELSE
      SET v_amt = v_per;
    END IF;
    INSERT INTO borrow_material_monthly_installments (schedule_id, period_no, due_date, amount_due, status, updated_at)
    VALUES (v_schedule_id, v_i, v_due, v_amt, 0, p_updated_at);
    SET v_i = v_i + 1;
  END WHILE;
  SELECT v_schedule_id AS insertId;
END;

CREATE PROCEDURE sp_update_borrow_material_monthly_installment_status(
  IN p_customer_id INT UNSIGNED,
  IN p_schedule_id INT UNSIGNED,
  IN p_installment_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE borrow_material_monthly_installments i
  INNER JOIN borrow_material_monthly_schedules s
    ON s.id = i.schedule_id AND s.customer_id = p_customer_id
  SET
    i.status = p_status,
    i.paid_at = IF(p_status = 1, p_updated_at, NULL),
    i.updated_at = p_updated_at
  WHERE i.id = p_installment_id AND i.schedule_id = p_schedule_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

CREATE PROCEDURE sp_delete_borrow_material_monthly_schedule(IN p_id INT UNSIGNED, IN p_customer_id INT UNSIGNED)
BEGIN
  DELETE FROM borrow_material_monthly_schedules WHERE id = p_id AND customer_id = p_customer_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

DROP PROCEDURE IF EXISTS sp_dashboard_totals;
CREATE PROCEDURE sp_dashboard_totals()
SELECT
  (SELECT COUNT(*) FROM orders) AS orders,
  (SELECT COUNT(*) FROM producers WHERE is_active = 1) AS producers,
  (SELECT COUNT(*) FROM delivery_agents WHERE is_active = 1) AS deliveryAgents,
  (SELECT COALESCE(SUM(amount_total), 0) FROM orders) AS totalRevenue,
  0 AS totalCollected,
  0 AS totalDiscrepancy,
  0 AS totalLossQty,
  0 AS totalRemainingQty;

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
(1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customerItemPrices'), (1, 'customers'), (1, 'depots'),
(1, 'addresses'), (1, 'producers'), (1, 'deliveryAgents'), (1, 'trucks'), (1, 'orders'), (1, 'orderGroups'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'),
(1, 'users'),
(1, 'borrowedMaterials'),
(2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'depots'),
(2, 'addresses'), (2, 'producers'), (2, 'deliveryAgents'), (2, 'trucks'), (2, 'orders'), (2, 'orderGroups'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'),
(2, 'borrowedMaterials'),
(3, 'overview'), (3, 'deliveryAgents'), (3, 'trucks'), (3, 'orders'),
(4, 'overview'), (4, 'orders'),
(5, 'overview'), (5, 'orders'),
(6, 'overview'), (6, 'addresses'), (6, 'customers'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'borrowedMaterials')
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

-- 3) Ensure order_groups exists (legacy compatibility)
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

SET @has_addresses_order_group_fk := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'addresses'
    AND constraint_name = 'fk_addresses_order_group'
);
SET @sql_drop_addresses_order_group_fk := IF(
  @has_addresses_order_group_fk > 0,
  'ALTER TABLE addresses DROP FOREIGN KEY fk_addresses_order_group',
  'SELECT 1'
);
PREPARE stmt_drop_addresses_order_group_fk FROM @sql_drop_addresses_order_group_fk;
EXECUTE stmt_drop_addresses_order_group_fk;
DEALLOCATE PREPARE stmt_drop_addresses_order_group_fk;

SET @has_addresses_order_group_idx := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'addresses'
    AND index_name = 'idx_addresses_order_group_id'
);
SET @sql_drop_addresses_order_group_idx := IF(
  @has_addresses_order_group_idx > 0,
  'ALTER TABLE addresses DROP INDEX idx_addresses_order_group_id',
  'SELECT 1'
);
PREPARE stmt_drop_addresses_order_group_idx FROM @sql_drop_addresses_order_group_idx;
EXECUTE stmt_drop_addresses_order_group_idx;
DEALLOCATE PREPARE stmt_drop_addresses_order_group_idx;

SET @has_addresses_order_group_id_col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'addresses'
    AND column_name = 'order_group_id'
);
SET @sql_drop_addresses_order_group_id_col := IF(
  @has_addresses_order_group_id_col > 0,
  'ALTER TABLE addresses DROP COLUMN order_group_id',
  'SELECT 1'
);
PREPARE stmt_drop_addresses_order_group_id_col FROM @sql_drop_addresses_order_group_id_col;
EXECUTE stmt_drop_addresses_order_group_id_col;
DEALLOCATE PREPARE stmt_drop_addresses_order_group_id_col;

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

-- 7a) Customers: name and phone nullable
SET @cust_name_not_null := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'name'
    AND is_nullable = 'NO'
);
SET @sql_cust_name_null := IF(
  @cust_name_not_null > 0,
  'ALTER TABLE customers MODIFY COLUMN name VARCHAR(120) NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt_cust_name_null FROM @sql_cust_name_null;
EXECUTE stmt_cust_name_null;
DEALLOCATE PREPARE stmt_cust_name_null;

SET @cust_phone_not_null := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'phone'
    AND is_nullable = 'NO'
);
SET @sql_cust_phone_null := IF(
  @cust_phone_not_null > 0,
  'ALTER TABLE customers MODIFY COLUMN phone VARCHAR(30) NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt_cust_phone_null FROM @sql_cust_phone_null;
EXECUTE stmt_cust_phone_null;
DEALLOCATE PREPARE stmt_cust_phone_null;

UPDATE customers SET phone = NULL WHERE phone = '';

SET @has_customers_sub_address := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'sub_address'
);
SET @sql_drop_customers_sub_address := IF(
  @has_customers_sub_address > 0,
  'ALTER TABLE customers DROP COLUMN sub_address',
  'SELECT 1'
);
PREPARE stmt_drop_customers_sub_address FROM @sql_drop_customers_sub_address;
EXECUTE stmt_drop_customers_sub_address;
DEALLOCATE PREPARE stmt_drop_customers_sub_address;

-- 8) Drop default item prices (pricing now managed by customer_item_prices)
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

SET @sql_drop_items_price_usd := IF(
  @has_items_price_usd > 0,
  'ALTER TABLE items DROP COLUMN default_unit_price_usd',
  'SELECT 1'
);
PREPARE stmt_drop_items_price_usd FROM @sql_drop_items_price_usd;
EXECUTE stmt_drop_items_price_usd;
DEALLOCATE PREPARE stmt_drop_items_price_usd;

SET @sql_drop_items_price_khr := IF(
  @has_items_price_khr > 0,
  'ALTER TABLE items DROP COLUMN default_unit_price_khr',
  'SELECT 1'
);
PREPARE stmt_drop_items_price_khr FROM @sql_drop_items_price_khr;
EXECUTE stmt_drop_items_price_khr;
DEALLOCATE PREPARE stmt_drop_items_price_khr;

SET @sql_drop_items_legacy_price := IF(
  @has_items_legacy_price > 0,
  'ALTER TABLE items DROP COLUMN default_unit_price',
  'SELECT 1'
);
PREPARE stmt_drop_items_legacy_price FROM @sql_drop_items_legacy_price;
EXECUTE stmt_drop_items_legacy_price;
DEALLOCATE PREPARE stmt_drop_items_legacy_price;

-- 9) Drop items.customer_id if present (items are catalog-wide)
SET @has_items_customer_col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'items'
    AND column_name = 'customer_id'
);
SET @items_customer_fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE table_schema = DATABASE()
    AND table_name = 'items'
    AND column_name = 'customer_id'
    AND referenced_table_name IS NOT NULL
  LIMIT 1
);
SET @sql_drop_items_cust_fk := IF(
  @has_items_customer_col > 0 AND @items_customer_fk IS NOT NULL,
  CONCAT('ALTER TABLE items DROP FOREIGN KEY ', @items_customer_fk),
  'SELECT 1'
);
PREPARE stmt_drop_items_cust_fk FROM @sql_drop_items_cust_fk;
EXECUTE stmt_drop_items_cust_fk;
DEALLOCATE PREPARE stmt_drop_items_cust_fk;
SET @sql_drop_items_cust_col := IF(
  @has_items_customer_col > 0,
  'ALTER TABLE items DROP COLUMN customer_id',
  'SELECT 1'
);
PREPARE stmt_drop_items_cust_col FROM @sql_drop_items_cust_col;
EXECUTE stmt_drop_items_cust_col;
DEALLOCATE PREPARE stmt_drop_items_cust_col;

-- 10) Ensure orders.currency exists and defaults to KHR
SET @has_orders_currency := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'currency'
);
SET @sql_add_orders_currency := IF(
  @has_orders_currency = 0,
  'ALTER TABLE orders ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT ''KHR'' AFTER item_id',
  'SELECT 1'
);
PREPARE stmt_add_orders_currency FROM @sql_add_orders_currency;
EXECUTE stmt_add_orders_currency;
DEALLOCATE PREPARE stmt_add_orders_currency;

UPDATE orders SET currency = 'KHR' WHERE currency IS NULL OR currency = '';

-- 13) Remove SUPPLIER_ORDER_READY and collapse flow to Ready_For_Delivery (when that status exists)
SET @supplier_ready_id := (
  SELECT id FROM status WHERE name = 'SUPPLIER_ORDER_READY' LIMIT 1
);
SET @out_for_delivery_id := (
  SELECT id FROM status WHERE name = 'Ready_For_Delivery' LIMIT 1
);

SET @sql_migrate_order_status_supplier_ready := IF(
  @supplier_ready_id IS NOT NULL AND @out_for_delivery_id IS NOT NULL,
  CONCAT('UPDATE orders SET status = ', @out_for_delivery_id, ' WHERE status = ', @supplier_ready_id),
  'SELECT 1'
);
PREPARE stmt_migrate_order_status_supplier_ready FROM @sql_migrate_order_status_supplier_ready;
EXECUTE stmt_migrate_order_status_supplier_ready;
DEALLOCATE PREPARE stmt_migrate_order_status_supplier_ready;

SET @sql_migrate_history_from_supplier_ready := IF(
  @supplier_ready_id IS NOT NULL AND @out_for_delivery_id IS NOT NULL,
  CONCAT('UPDATE order_status_history SET from_status = ', @out_for_delivery_id, ' WHERE from_status = ', @supplier_ready_id),
  'SELECT 1'
);
PREPARE stmt_migrate_history_from_supplier_ready FROM @sql_migrate_history_from_supplier_ready;
EXECUTE stmt_migrate_history_from_supplier_ready;
DEALLOCATE PREPARE stmt_migrate_history_from_supplier_ready;

SET @sql_migrate_history_to_supplier_ready := IF(
  @supplier_ready_id IS NOT NULL AND @out_for_delivery_id IS NOT NULL,
  CONCAT('UPDATE order_status_history SET to_status = ', @out_for_delivery_id, ' WHERE to_status = ', @supplier_ready_id),
  'SELECT 1'
);
PREPARE stmt_migrate_history_to_supplier_ready FROM @sql_migrate_history_to_supplier_ready;
EXECUTE stmt_migrate_history_to_supplier_ready;
DEALLOCATE PREPARE stmt_migrate_history_to_supplier_ready;

DELETE FROM status WHERE name = 'SUPPLIER_ORDER_READY';

-- 14) Ensure borrow_materials and customer_borrowed_materials tables exist
SET @has_borrow_materials := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'borrow_materials'
);
SET @sql_create_borrow_materials := IF(
  @has_borrow_materials = 0,
  'CREATE TABLE borrow_materials (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    unit VARCHAR(30) DEFAULT '''',
    note VARCHAR(255) DEFAULT '''',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_borrow_materials_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_borrow_materials FROM @sql_create_borrow_materials;
EXECUTE stmt_create_borrow_materials;
DEALLOCATE PREPARE stmt_create_borrow_materials;

SET @has_customer_borrowed_materials := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_borrowed_materials'
);
SET @sql_create_customer_borrowed_materials := IF(
  @has_customer_borrowed_materials = 0,
  'CREATE TABLE customer_borrowed_materials (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    material_id INT UNSIGNED NOT NULL,
    qty INT UNSIGNED NOT NULL DEFAULT 0,
    note VARCHAR(255) DEFAULT '''',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cbm_customer_material (customer_id, material_id),
    KEY idx_cbm_customer (customer_id),
    KEY idx_cbm_material (material_id),
    CONSTRAINT fk_cbm_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_cbm_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_customer_borrowed_materials FROM @sql_create_customer_borrowed_materials;
EXECUTE stmt_create_customer_borrowed_materials;
DEALLOCATE PREPARE stmt_create_customer_borrowed_materials;

-- 15) Grant new borrowedMaterials menu to existing Admin/Owner/Depot roles
INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'borrowedMaterials'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

-- 16) Assign Orders page (Admin + Owner)
INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'assignOrders'
FROM roles r
WHERE r.name IN ('Admin', 'Owner')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

-- 17) Drop orders.delivery_agent_id; refresh order procedures (delivery agent via truck join)
DROP PROCEDURE IF EXISTS sp_get_order_by_id;
DROP PROCEDURE IF EXISTS sp_list_orders;
DROP PROCEDURE IF EXISTS sp_create_order;
DROP PROCEDURE IF EXISTS sp_update_order_assignment;

SET @has_ord_da_fk := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND constraint_name = 'fk_orders_delivery_agent'
);
SET @sql_drop_ord_da_fk := IF(
  @has_ord_da_fk > 0,
  'ALTER TABLE orders DROP FOREIGN KEY fk_orders_delivery_agent',
  'SELECT 1'
);
PREPARE stmt_drop_ord_da_fk FROM @sql_drop_ord_da_fk;
EXECUTE stmt_drop_ord_da_fk;
DEALLOCATE PREPARE stmt_drop_ord_da_fk;

SET @has_ord_da_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'delivery_agent_id'
);
SET @sql_drop_ord_da_col := IF(
  @has_ord_da_col > 0,
  'ALTER TABLE orders DROP COLUMN delivery_agent_id',
  'SELECT 1'
);
PREPARE stmt_drop_ord_da_col FROM @sql_drop_ord_da_col;
EXECUTE stmt_drop_ord_da_col;
DEALLOCATE PREPARE stmt_drop_ord_da_col;

CREATE PROCEDURE sp_get_order_by_id(IN p_id INT UNSIGNED)
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.currency, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, da.id AS delivery_agent_id, o.delivery_time,
  o.amount_total, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents da ON da.id = t.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
WHERE o.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_list_orders()
SELECT
  o.id, c.name AS customer_name, o.address, oa.name AS order_address_name, c.address AS customer_address_id, ca.name AS customer_address_name, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.currency, o.ordered_qty, o.unit_price,
  o.producer_id, o.truck_id, da.id AS delivery_agent_id, o.delivery_time,
  o.amount_total, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  t.code AS truck_code,
  t.plate_no AS truck_plate_no,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN addresses oa ON oa.id = o.address
INNER JOIN addresses ca ON ca.id = c.address
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN trucks t ON t.id = o.truck_id
LEFT JOIN delivery_agents da ON da.id = t.delivery_agent_id
LEFT JOIN order_groups og ON og.id = o.order_group_id
ORDER BY o.id DESC;

CREATE PROCEDURE sp_create_order(
  IN p_customer_id INT UNSIGNED,
  IN p_address INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_ordered_qty DECIMAL(12,2),
  IN p_unit_price DECIMAL(12,2),
  IN p_currency VARCHAR(10),
  IN p_producer_id INT UNSIGNED,
  IN p_truck_id INT UNSIGNED,
  IN p_amount_total DECIMAL(12,2),
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO orders (
    customer_id, address, order_group_id, item_id, currency, ordered_qty, unit_price, producer_id, truck_id, delivery_time,
    amount_total, status, updated_at
  )
  VALUES (
    p_customer_id, p_address, NULL, p_item_id, p_currency, p_ordered_qty, p_unit_price, p_producer_id, p_truck_id, NULL,
    p_amount_total, p_status, p_updated_at
  );
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_update_order_assignment(
  IN p_id INT UNSIGNED,
  IN p_producer_id INT UNSIGNED,
  IN p_truck_id INT UNSIGNED,
  IN p_order_group_id INT UNSIGNED,
  IN p_delivery_time DATETIME,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE orders
SET producer_id = COALESCE(p_producer_id, producer_id),
    truck_id = COALESCE(p_truck_id, truck_id),
    order_group_id = COALESCE(p_order_group_id, order_group_id),
    delivery_time = COALESCE(p_delivery_time, delivery_time),
    status = COALESCE(p_status, status),
    updated_at = p_updated_at
WHERE id = p_id;

-- 18) Order movement + Payments menu for existing installs (idempotent)
INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'orderMovement'
FROM roles r
WHERE r.name IN ('Admin', 'Owner')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'payments'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'customerItemPrices'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

-- 19) Borrow material order loans + monthly payment schedules (idempotent)
SET @has_bmol := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'borrow_material_order_loans'
);
SET @sql_create_bmol := IF(
  @has_bmol = 0,
  'CREATE TABLE borrow_material_order_loans (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    material_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED NOT NULL,
    fixed_unit_price DECIMAL(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT ''KHR'',
    ordered_qty INT UNSIGNED NOT NULL,
    computed_line_total DECIMAL(14,2) NOT NULL,
    note VARCHAR(255) DEFAULT '''',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bmol_order (order_id),
    KEY idx_bmol_customer (customer_id),
    KEY idx_bmol_material (material_id),
    CONSTRAINT fk_bmol_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_bmol_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_bmol_order FOREIGN KEY (order_id) REFERENCES orders (id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_bmol FROM @sql_create_bmol;
EXECUTE stmt_create_bmol;
DEALLOCATE PREPARE stmt_create_bmol;

SET @has_bmms := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'borrow_material_monthly_schedules'
);
SET @sql_create_bmms := IF(
  @has_bmms = 0,
  'CREATE TABLE borrow_material_monthly_schedules (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    material_id INT UNSIGNED NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT ''KHR'',
    total_period INT UNSIGNED NOT NULL,
    start_due_date DATE NOT NULL,
    note VARCHAR(255) DEFAULT '''',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_bmms_customer (customer_id),
    KEY idx_bmms_material (material_id),
    CONSTRAINT fk_bmms_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_bmms_material FOREIGN KEY (material_id) REFERENCES borrow_materials (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_bmms FROM @sql_create_bmms;
EXECUTE stmt_create_bmms;
DEALLOCATE PREPARE stmt_create_bmms;

SET @has_bmmsi := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'borrow_material_monthly_installments'
);
SET @sql_create_bmmsi := IF(
  @has_bmmsi = 0,
  'CREATE TABLE borrow_material_monthly_installments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    schedule_id INT UNSIGNED NOT NULL,
    period_no INT UNSIGNED NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(14,2) NOT NULL,
    status TINYINT UNSIGNED NOT NULL DEFAULT 0,
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bmmsi_schedule_period (schedule_id, period_no),
    KEY idx_bmmsi_schedule (schedule_id),
    CONSTRAINT fk_bmmsi_schedule FOREIGN KEY (schedule_id) REFERENCES borrow_material_monthly_schedules (id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_bmmsi FROM @sql_create_bmmsi;
EXECUTE stmt_create_bmmsi;
DEALLOCATE PREPARE stmt_create_bmmsi;

-- 20) borrow_material_monthly_installments: amount_paid -> status (0=unpaid, 1=paid)
SET @bmmsi_has_amount_paid := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'borrow_material_monthly_installments' AND column_name = 'amount_paid'
);
SET @bmmsi_has_status := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'borrow_material_monthly_installments' AND column_name = 'status'
);
SET @sql_bmmsi_add_status := IF(
  @bmmsi_has_amount_paid > 0 AND @bmmsi_has_status = 0,
  'ALTER TABLE borrow_material_monthly_installments ADD COLUMN status TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER amount_due',
  'SELECT 1'
);
PREPARE stmt_bmmsi_add_status FROM @sql_bmmsi_add_status;
EXECUTE stmt_bmmsi_add_status;
DEALLOCATE PREPARE stmt_bmmsi_add_status;

SET @sql_bmmsi_fill_status := IF(
  @bmmsi_has_amount_paid > 0,
  'UPDATE borrow_material_monthly_installments SET status = IF(amount_paid >= amount_due, 1, 0)',
  'SELECT 1'
);
PREPARE stmt_bmmsi_fill_status FROM @sql_bmmsi_fill_status;
EXECUTE stmt_bmmsi_fill_status;
DEALLOCATE PREPARE stmt_bmmsi_fill_status;

SET @sql_bmmsi_drop_ap := IF(
  @bmmsi_has_amount_paid > 0,
  'ALTER TABLE borrow_material_monthly_installments DROP COLUMN amount_paid',
  'SELECT 1'
);
PREPARE stmt_bmmsi_drop_ap FROM @sql_bmmsi_drop_ap;
EXECUTE stmt_bmmsi_drop_ap;
DEALLOCATE PREPARE stmt_bmmsi_drop_ap;

DROP PROCEDURE IF EXISTS sp_list_borrow_material_monthly_installments;
DROP PROCEDURE IF EXISTS sp_create_borrow_material_monthly_schedule;
DROP PROCEDURE IF EXISTS sp_update_borrow_material_monthly_installment_status;

CREATE PROCEDURE sp_list_borrow_material_monthly_installments(IN p_schedule_id INT UNSIGNED)
SELECT id, schedule_id, period_no, due_date, amount_due, status, paid_at, created_at, updated_at
FROM borrow_material_monthly_installments
WHERE schedule_id = p_schedule_id
ORDER BY id DESC;

CREATE PROCEDURE sp_create_borrow_material_monthly_schedule(
  IN p_customer_id INT UNSIGNED,
  IN p_material_id INT UNSIGNED,
  IN p_total_amount DECIMAL(14,2),
  IN p_currency VARCHAR(10),
  IN p_total_period INT UNSIGNED,
  IN p_start_due_date DATE,
  IN p_note VARCHAR(255),
  IN p_updated_at DATETIME
)
BEGIN
  DECLARE v_schedule_id INT UNSIGNED;
  DECLARE v_i INT UNSIGNED DEFAULT 1;
  DECLARE v_per DECIMAL(14,2);
  DECLARE v_last DECIMAL(14,2);
  DECLARE v_due DATE;
  DECLARE v_amt DECIMAL(14,2);
  IF p_total_period < 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'total_period must be at least 1';
  END IF;
  INSERT INTO borrow_material_monthly_schedules (
    customer_id, material_id, total_amount, currency, total_period, start_due_date, note, updated_at
  )
  VALUES (
    p_customer_id, p_material_id, p_total_amount, p_currency, p_total_period, p_start_due_date, p_note, p_updated_at
  );
  SET v_schedule_id = LAST_INSERT_ID();
  SET v_per = TRUNCATE(p_total_amount / p_total_period, 2);
  SET v_last = p_total_amount - v_per * (p_total_period - 1);
  WHILE v_i <= p_total_period DO
    SET v_due = DATE_ADD(p_start_due_date, INTERVAL (v_i - 1) MONTH);
    IF v_i = p_total_period THEN
      SET v_amt = v_last;
    ELSE
      SET v_amt = v_per;
    END IF;
    INSERT INTO borrow_material_monthly_installments (schedule_id, period_no, due_date, amount_due, status, updated_at)
    VALUES (v_schedule_id, v_i, v_due, v_amt, 0, p_updated_at);
    SET v_i = v_i + 1;
  END WHILE;
  SELECT v_schedule_id AS insertId;
END;

CREATE PROCEDURE sp_update_borrow_material_monthly_installment_status(
  IN p_customer_id INT UNSIGNED,
  IN p_schedule_id INT UNSIGNED,
  IN p_installment_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE borrow_material_monthly_installments i
  INNER JOIN borrow_material_monthly_schedules s
    ON s.id = i.schedule_id AND s.customer_id = p_customer_id
  SET
    i.status = p_status,
    i.paid_at = IF(p_status = 1, p_updated_at, NULL),
    i.updated_at = p_updated_at
  WHERE i.id = p_installment_id AND i.schedule_id = p_schedule_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

-- 21) Customer-specific item pricing (idempotent)
SET @has_customer_item_prices := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'customer_item_prices'
);
SET @sql_create_customer_item_prices := IF(
  @has_customer_item_prices = 0,
  'CREATE TABLE customer_item_prices (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT ''KHR'',
    unit_price DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_customer_item_currency (customer_id, item_id, currency),
    KEY idx_customer_item_prices_customer (customer_id),
    KEY idx_customer_item_prices_item (item_id),
    CONSTRAINT fk_customer_item_prices_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_customer_item_prices_item FOREIGN KEY (item_id) REFERENCES items (id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_create_customer_item_prices FROM @sql_create_customer_item_prices;
EXECUTE stmt_create_customer_item_prices;
DEALLOCATE PREPARE stmt_create_customer_item_prices;

DROP PROCEDURE IF EXISTS sp_list_customer_item_prices;
DROP PROCEDURE IF EXISTS sp_get_customer_item_price;
DROP PROCEDURE IF EXISTS sp_upsert_customer_item_price;
DROP PROCEDURE IF EXISTS sp_delete_customer_item_price;

CREATE PROCEDURE sp_list_customer_item_prices()
SELECT
  cip.id,
  cip.customer_id,
  c.name AS customer_name,
  cip.item_id,
  i.name AS item_name,
  i.sku AS item_sku,
  cip.currency,
  cip.unit_price,
  cip.created_at,
  cip.updated_at
FROM customer_item_prices cip
INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1
INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1
ORDER BY cip.id DESC;

CREATE PROCEDURE sp_get_customer_item_price(
  IN p_customer_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_currency VARCHAR(10)
)
SELECT
  cip.id,
  cip.customer_id,
  c.name AS customer_name,
  cip.item_id,
  i.name AS item_name,
  i.sku AS item_sku,
  cip.currency,
  cip.unit_price,
  cip.created_at,
  cip.updated_at
FROM customer_item_prices cip
INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1
INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1
WHERE cip.customer_id = p_customer_id
  AND cip.item_id = p_item_id
  AND cip.currency = p_currency
LIMIT 1;

CREATE PROCEDURE sp_upsert_customer_item_price(
  IN p_customer_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_currency VARCHAR(10),
  IN p_unit_price DECIMAL(14,2),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customer_item_prices (customer_id, item_id, currency, unit_price, updated_at)
  VALUES (p_customer_id, p_item_id, p_currency, p_unit_price, p_updated_at)
  ON DUPLICATE KEY UPDATE
    unit_price = VALUES(unit_price),
    updated_at = VALUES(updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

CREATE PROCEDURE sp_delete_customer_item_price(IN p_id INT UNSIGNED)
BEGIN
  DELETE FROM customer_item_prices WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;

SET FOREIGN_KEY_CHECKS = 1;
