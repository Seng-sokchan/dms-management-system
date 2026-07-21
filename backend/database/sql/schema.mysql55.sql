SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- Indexes target hot WHERE/JOIN paths; no FOREIGN KEY constraints (integrity in app layer).
-- Prefer composites on order_details; skip name indexes on small lookup tables.

DROP TABLE IF EXISTS `borrow_materials`;
DROP TABLE IF EXISTS `borrow_material_monthly_installments`;
DROP TABLE IF EXISTS `borrow_material_monthly_schedules`;
DROP TABLE IF EXISTS `borrow_material_order_loans`;
DROP TABLE IF EXISTS `catalogs`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `customer_borrowed_materials`;
DROP TABLE IF EXISTS `customer_item_prices`;
DROP TABLE IF EXISTS `delivery_agents`;
DROP TABLE IF EXISTS `delivery_agent_locations`;
DROP TABLE IF EXISTS `depots`;
DROP TABLE IF EXISTS `depot_item_prices`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `order_details`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `producers`;
DROP TABLE IF EXISTS `provinces`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `status`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `app_settings`;

CREATE TABLE `borrow_materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `unit` varchar(30) DEFAULT '',
  `note` varchar(255) DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `borrow_material_monthly_installments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `schedule_id` int(10) unsigned NOT NULL,
  `period_no` int(10) unsigned NOT NULL,
  `due_date` date NOT NULL,
  `amount_due` decimal(14,2) NOT NULL,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0=unpaid, 1=paid',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bmmsi_schedule_period` (`schedule_id`,`period_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `borrow_material_monthly_schedules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'KHR',
  `total_period` int(10) unsigned NOT NULL,
  `start_due_date` date NOT NULL,
  `note` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bmms_customer` (`customer_id`),
  KEY `idx_bmms_material` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `borrow_material_order_loans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned NOT NULL,
  `order_id` int(10) unsigned NOT NULL,
  `fixed_unit_price` decimal(14,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'KHR',
  `ordered_qty` int(10) unsigned NOT NULL,
  `computed_line_total` decimal(14,2) NOT NULL,
  `note` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bmol_order` (`order_id`),
  KEY `idx_bmol_customer` (`customer_id`),
  KEY `idx_bmol_material` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `catalogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `note` varchar(255) DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `customers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `depot_id` int(10) unsigned DEFAULT NULL,
  `province_id` int(10) unsigned DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customers_name` (`name`),
  KEY `idx_customers_depot_id` (`depot_id`),
  KEY `idx_customers_province_id` (`province_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `customer_borrowed_materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned NOT NULL,
  `qty` int(10) unsigned NOT NULL DEFAULT '0',
  `note` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cbm_customer_material` (`customer_id`,`material_id`),
  KEY `idx_cbm_material` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `customer_item_prices` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'KHR',
  `unit_price` decimal(14,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_item_currency` (`customer_id`,`item_id`,`currency`),
  KEY `idx_customer_item_prices_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `delivery_agents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `vehicle_type` varchar(60) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `delivery_agent_locations` (
  `delivery_agent_id` int(10) unsigned NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy` decimal(8,2) DEFAULT NULL,
  `recorded_at` datetime NOT NULL,
  PRIMARY KEY (`delivery_agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `depots` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `phone` varchar(30) DEFAULT '',
  `address` varchar(255) DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `depot_item_prices` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `depot_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'KHR',
  `unit_price` decimal(14,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_depot_item_currency` (`depot_id`,`item_id`,`currency`),
  KEY `idx_depot_item_prices_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `catalog_id` int(10) unsigned NOT NULL,
  `name` varchar(120) NOT NULL,
  `sku` varchar(40) DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_items_catalog` (`catalog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `target_type` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `order_no` varchar(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `order_details` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'KHR',
  `ordered_qty` int(10) unsigned NOT NULL,
  `delivered_qty` int(10) unsigned DEFAULT NULL,
  `loss_qty` int(10) unsigned DEFAULT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `producer_id` int(10) unsigned DEFAULT NULL,
  `delivery_agent_id` int(10) unsigned DEFAULT NULL,
  `delivery_time` datetime DEFAULT NULL,
  `amount_total` decimal(14,2) NOT NULL,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_details_order_id` (`order_id`),
  KEY `idx_od_customer_status` (`customer_id`,`status`),
  KEY `idx_od_agent_status` (`delivery_agent_id`,`status`),
  KEY `idx_od_status_created` (`status`,`created_at`),
  KEY `idx_order_details_producer_id` (`producer_id`),
  KEY `idx_order_details_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `order_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `provider` varchar(32) NOT NULL DEFAULT 'payway',
  `payway_tran_id` varchar(20) NOT NULL,
  `provider_tran_id` varchar(64) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'KHR',
  `raw_callback_payload` longtext,
  `verified_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_payway_tran_id` (`payway_tran_id`),
  KEY `idx_payments_order` (`order_id`),
  KEY `idx_payments_customer_created` (`customer_id`,`created_at`),
  KEY `idx_payments_provider_tran` (`provider_tran_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `producers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `capacity_note` varchar(255) DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `provinces` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `status` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `sort_order` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_status_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `delivery_agent_id` int(10) unsigned DEFAULT NULL,
  `depot_id` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_customer_id` (`customer_id`),
  UNIQUE KEY `uq_users_delivery_agent_id` (`delivery_agent_id`),
  UNIQUE KEY `uq_users_depot_id` (`depot_id`),
  KEY `idx_users_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `app_settings` (
  `setting_key` varchar(64) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Read views (replaces sp_get_* / sp_list_* for queries)

DROP VIEW IF EXISTS v_dashboard_currency_totals;
DROP VIEW IF EXISTS v_dashboard_totals;
DROP VIEW IF EXISTS v_dashboard_status_summary;
DROP VIEW IF EXISTS v_borrow_material_monthly_installments;
DROP VIEW IF EXISTS v_borrow_material_monthly_schedules;
DROP VIEW IF EXISTS v_borrow_material_order_loans;
DROP VIEW IF EXISTS v_customer_borrowed_materials;
DROP VIEW IF EXISTS v_borrow_materials;
DROP VIEW IF EXISTS v_roles;
DROP VIEW IF EXISTS v_statuses;
DROP VIEW IF EXISTS v_orders;
DROP VIEW IF EXISTS v_depot_item_prices;
DROP VIEW IF EXISTS v_customer_item_prices;
DROP VIEW IF EXISTS v_items;
DROP VIEW IF EXISTS v_catalogs;
DROP VIEW IF EXISTS v_customers;
DROP VIEW IF EXISTS v_provinces;
DROP VIEW IF EXISTS v_depots;
DROP VIEW IF EXISTS v_delivery_agents;
DROP VIEW IF EXISTS v_producers;
DROP VIEW IF EXISTS v_users;

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
INNER JOIN roles r ON r.id = u.role_id;

CREATE VIEW v_producers AS
SELECT id, name, phone, capacity_note
FROM producers
WHERE is_active = 1;

CREATE VIEW v_delivery_agents AS
SELECT id, name, phone, vehicle_type
FROM delivery_agents
WHERE is_active = 1;

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
WHERE d.is_active = 1;

CREATE VIEW v_provinces AS
SELECT id, name
FROM provinces
WHERE is_active = 1;

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
WHERE c.is_active = 1;

CREATE VIEW v_catalogs AS
SELECT id, name, note
FROM catalogs
WHERE is_active = 1;

CREATE VIEW v_items AS
SELECT i.id, i.catalog_id, i.name, i.sku, c.name AS catalog_name
FROM items i
INNER JOIN catalogs c ON c.id = i.catalog_id
WHERE i.is_active = 1 AND c.is_active = 1;

CREATE VIEW v_customer_item_prices AS
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
INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1 AND c.depot_id IS NULL
INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1;

CREATE VIEW v_depot_item_prices AS
SELECT
  dip.id,
  dip.depot_id,
  d.name AS depot_name,
  dip.item_id,
  i.name AS item_name,
  i.sku AS item_sku,
  dip.currency,
  dip.unit_price,
  dip.created_at,
  dip.updated_at
FROM depot_item_prices dip
INNER JOIN depots d ON d.id = dip.depot_id AND d.is_active = 1
INNER JOIN items i ON i.id = dip.item_id AND i.is_active = 1;

CREATE VIEW v_orders AS
SELECT
  od.id,
  om.id AS master_order_id,
  om.target_type AS master_order_type,
  om.order_no AS master_order_no,
  c.name AS customer_name,
  od.customer_id,
  od.item_id,
  od.currency,
  od.ordered_qty,
  od.delivered_qty,
  od.loss_qty,
  od.unit_price,
  od.producer_id,
  od.delivery_agent_id,
  od.delivery_time,
  od.amount_total,
  CASE
    WHEN EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id) THEN 'paid'
    ELSE 'unpaid'
  END AS payment_status,
  s.name AS status,
  od.created_at,
  od.updated_at,
  c.phone AS customer_phone,
  c.province_id AS customer_province_id,
  pr.name AS customer_province_name,
  c.latitude AS customer_latitude,
  c.longitude AS customer_longitude,
  p.name AS producer_name,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM order_details od
INNER JOIN orders om ON om.id = od.order_id
INNER JOIN customers c ON c.id = od.customer_id
INNER JOIN items it ON it.id = od.item_id
INNER JOIN status s ON s.id = od.status
LEFT JOIN provinces pr ON pr.id = c.province_id AND pr.is_active = 1
LEFT JOIN producers p ON p.id = od.producer_id
LEFT JOIN delivery_agents da ON da.id = od.delivery_agent_id;

CREATE VIEW v_statuses AS
SELECT id, name, sort_order
FROM status;

CREATE VIEW v_roles AS
SELECT id, name
FROM roles;

CREATE VIEW v_borrow_materials AS
SELECT id, name, unit, note
FROM borrow_materials
WHERE is_active = 1;

CREATE VIEW v_customer_borrowed_materials AS
SELECT
  cbm.id,
  cbm.customer_id,
  c.name AS customer_name,
  cbm.material_id,
  m.name AS material_name,
  m.unit,
  cbm.qty,
  cbm.note,
  cbm.created_at,
  cbm.updated_at
FROM customer_borrowed_materials cbm
INNER JOIN borrow_materials m ON m.id = cbm.material_id
INNER JOIN customers c ON c.id = cbm.customer_id
WHERE m.is_active = 1 AND c.is_active = 1;

CREATE VIEW v_borrow_material_order_loans AS
SELECT
  l.id,
  l.customer_id,
  c.name AS customer_name,
  l.material_id,
  m.name AS material_name,
  m.unit,
  l.order_id,
  l.fixed_unit_price,
  l.currency,
  l.ordered_qty,
  l.computed_line_total,
  l.note,
  l.created_at,
  l.updated_at
FROM borrow_material_order_loans l
INNER JOIN customers c ON c.id = l.customer_id
INNER JOIN borrow_materials m ON m.id = l.material_id
WHERE c.is_active = 1 AND m.is_active = 1;

CREATE VIEW v_borrow_material_monthly_schedules AS
SELECT
  s.id,
  s.customer_id,
  c.name AS customer_name,
  s.material_id,
  m.name AS material_name,
  m.unit,
  s.total_amount,
  s.currency,
  s.total_period,
  s.start_due_date,
  s.note,
  s.created_at,
  s.updated_at
FROM borrow_material_monthly_schedules s
INNER JOIN customers c ON c.id = s.customer_id
INNER JOIN borrow_materials m ON m.id = s.material_id
WHERE c.is_active = 1 AND m.is_active = 1;

CREATE VIEW v_borrow_material_monthly_installments AS
SELECT id, schedule_id, period_no, due_date, amount_due, status, paid_at, created_at, updated_at
FROM borrow_material_monthly_installments;

CREATE VIEW v_dashboard_status_summary AS
SELECT s.name AS status, COUNT(*) AS total
FROM order_details od
INNER JOIN status s ON s.id = od.status
GROUP BY s.name;

CREATE VIEW v_dashboard_totals AS
SELECT
  (SELECT COUNT(*) FROM order_details) AS orders,
  (SELECT COUNT(*) FROM producers WHERE is_active = 1) AS producers,
  (SELECT COUNT(*) FROM delivery_agents WHERE is_active = 1) AS deliveryAgents,
  (SELECT COALESCE(SUM(od.amount_total), 0)
   FROM order_details od
   INNER JOIN orders om ON om.id = od.order_id
   WHERE EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id)) AS totalRevenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments) AS totalCollected,
  (SELECT COALESCE(SUM(ordered_qty), 0) FROM order_details) AS totalOrderedQty,
  (SELECT COALESCE(SUM(delivered_qty), 0) FROM order_details) AS totalDeliveredQty,
  (SELECT COALESCE(SUM(loss_qty), 0) FROM order_details) AS totalLossQty,
  (SELECT COALESCE(SUM(
    GREATEST(ordered_qty - COALESCE(delivered_qty, 0) - COALESCE(loss_qty, 0), 0)
  ), 0) FROM order_details) AS totalRemainingQty;

CREATE VIEW v_dashboard_currency_totals AS
SELECT
  (SELECT COALESCE(SUM(od.amount_total), 0)
   FROM order_details od
   INNER JOIN orders om ON om.id = od.order_id
   WHERE od.currency = 'USD'
     AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id)) AS total_revenue_usd,
  (SELECT COALESCE(SUM(od.amount_total), 0)
   FROM order_details od
   INNER JOIN orders om ON om.id = od.order_id
   WHERE od.currency = 'KHR'
     AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id)) AS total_revenue_khr,
  (SELECT COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END), 0) FROM payments) AS total_collected_usd,
  (SELECT COALESCE(SUM(CASE WHEN currency = 'KHR' THEN amount ELSE 0 END), 0) FROM payments) AS total_collected_khr;

-- Write stored procedures
DROP PROCEDURE IF EXISTS sp_add_role_menu;
DROP PROCEDURE IF EXISTS sp_apply_payment_to_order;
DROP PROCEDURE IF EXISTS sp_confirm_order_delivery;
DROP PROCEDURE IF EXISTS sp_create_borrow_material;
DROP PROCEDURE IF EXISTS sp_create_borrow_material_monthly_schedule;
DROP PROCEDURE IF EXISTS sp_create_borrow_material_order_loan;
DROP PROCEDURE IF EXISTS sp_create_catalog;
DROP PROCEDURE IF EXISTS sp_create_customer;
DROP PROCEDURE IF EXISTS sp_create_delivery_agent;
DROP PROCEDURE IF EXISTS sp_create_depot;
DROP PROCEDURE IF EXISTS sp_create_item;
DROP PROCEDURE IF EXISTS sp_create_order;
DROP PROCEDURE IF EXISTS sp_create_order_detail;
DROP PROCEDURE IF EXISTS sp_create_order_group;
DROP PROCEDURE IF EXISTS sp_create_payment;
DROP PROCEDURE IF EXISTS sp_create_producer;
DROP PROCEDURE IF EXISTS sp_create_province;
DROP PROCEDURE IF EXISTS sp_create_truck;
DROP PROCEDURE IF EXISTS sp_create_user;
DROP PROCEDURE IF EXISTS sp_deactivate_user;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material_monthly_schedule;
DROP PROCEDURE IF EXISTS sp_delete_borrow_material_order_loan;
DROP PROCEDURE IF EXISTS sp_delete_catalog;
DROP PROCEDURE IF EXISTS sp_delete_customer;
DROP PROCEDURE IF EXISTS sp_delete_customer_borrowed_material;
DROP PROCEDURE IF EXISTS sp_delete_customer_item_price;
DROP PROCEDURE IF EXISTS sp_delete_delivery_agent;
DROP PROCEDURE IF EXISTS sp_delete_depot;
DROP PROCEDURE IF EXISTS sp_delete_depot_item_price;
DROP PROCEDURE IF EXISTS sp_delete_item;
DROP PROCEDURE IF EXISTS sp_delete_order;
DROP PROCEDURE IF EXISTS sp_delete_order_group;
DROP PROCEDURE IF EXISTS sp_delete_producer;
DROP PROCEDURE IF EXISTS sp_delete_province;
DROP PROCEDURE IF EXISTS sp_delete_truck;
DROP PROCEDURE IF EXISTS sp_set_customer_user_link;
DROP PROCEDURE IF EXISTS sp_set_delivery_agent_user_link;
DROP PROCEDURE IF EXISTS sp_set_depot_user_link;
DROP PROCEDURE IF EXISTS sp_update_borrow_material;
DROP PROCEDURE IF EXISTS sp_update_borrow_material_monthly_installment_status;
DROP PROCEDURE IF EXISTS sp_update_catalog;
DROP PROCEDURE IF EXISTS sp_update_customer;
DROP PROCEDURE IF EXISTS sp_update_delivery_agent;
DROP PROCEDURE IF EXISTS sp_update_depot;
DROP PROCEDURE IF EXISTS sp_update_item;
DROP PROCEDURE IF EXISTS sp_update_order_assignment;
DROP PROCEDURE IF EXISTS sp_update_order_group;
DROP PROCEDURE IF EXISTS sp_update_order_status;
DROP PROCEDURE IF EXISTS sp_update_producer;
DROP PROCEDURE IF EXISTS sp_update_province;
DROP PROCEDURE IF EXISTS sp_update_truck;
DROP PROCEDURE IF EXISTS sp_update_user;
DROP PROCEDURE IF EXISTS sp_upsert_customer_borrowed_material;
DROP PROCEDURE IF EXISTS sp_upsert_customer_item_price;
DROP PROCEDURE IF EXISTS sp_upsert_depot_item_price;

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
CREATE PROCEDURE sp_set_customer_user_link(IN p_customer_id INT UNSIGNED, IN p_user_id INT UNSIGNED)
BEGIN
  IF p_user_id IS NULL THEN
    IF p_customer_id IS NOT NULL THEN
      UPDATE users SET customer_id = NULL WHERE customer_id = p_customer_id;
    END IF;
  ELSEIF p_customer_id IS NULL THEN
    UPDATE users SET customer_id = NULL WHERE id = p_user_id;
  ELSE
    UPDATE users SET customer_id = NULL WHERE id = p_user_id;
    UPDATE users SET customer_id = NULL WHERE customer_id = p_customer_id AND id <> p_user_id;
    UPDATE users SET customer_id = p_customer_id WHERE id = p_user_id;
  END IF;
END;
CREATE PROCEDURE sp_set_delivery_agent_user_link(IN p_delivery_agent_id INT UNSIGNED, IN p_user_id INT UNSIGNED)
BEGIN
  IF p_user_id IS NULL THEN
    IF p_delivery_agent_id IS NOT NULL THEN
      UPDATE users SET delivery_agent_id = NULL WHERE delivery_agent_id = p_delivery_agent_id;
    END IF;
  ELSEIF p_delivery_agent_id IS NULL THEN
    UPDATE users SET delivery_agent_id = NULL WHERE id = p_user_id;
  ELSE
    UPDATE users SET delivery_agent_id = NULL WHERE id = p_user_id;
    UPDATE users SET delivery_agent_id = NULL WHERE delivery_agent_id = p_delivery_agent_id AND id <> p_user_id;
    UPDATE users SET delivery_agent_id = p_delivery_agent_id WHERE id = p_user_id;
  END IF;
END;
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
END;
CREATE PROCEDURE sp_upsert_depot_item_price(
  IN p_depot_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_currency VARCHAR(10),
  IN p_unit_price DECIMAL(14,2),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO depot_item_prices (depot_id, item_id, currency, unit_price, updated_at)
  VALUES (p_depot_id, p_item_id, p_currency, p_unit_price, p_updated_at)
  ON DUPLICATE KEY UPDATE
    unit_price = VALUES(unit_price),
    updated_at = VALUES(updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;
CREATE PROCEDURE sp_delete_depot_item_price(IN p_id INT UNSIGNED)
BEGIN
  DELETE FROM depot_item_prices WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END;
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
CREATE PROCEDURE sp_create_order_detail(
  IN p_order_id INT UNSIGNED,
  IN p_customer_id INT UNSIGNED,
  IN p_item_id INT UNSIGNED,
  IN p_ordered_qty DECIMAL(12,2),
  IN p_unit_price DECIMAL(12,2),
  IN p_currency VARCHAR(10),
  IN p_producer_id INT UNSIGNED,
  IN p_amount_total DECIMAL(12,2),
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO order_details (
    order_id, customer_id, item_id, currency, ordered_qty, unit_price, producer_id,
    delivery_agent_id, delivery_time, amount_total, status, updated_at
  )
  VALUES (
    p_order_id, p_customer_id, p_item_id, p_currency, p_ordered_qty, p_unit_price, p_producer_id,
    NULL, NULL, p_amount_total, p_status, p_updated_at
  );
  SELECT LAST_INSERT_ID() AS insertId;
END;
CREATE PROCEDURE sp_update_order_assignment(
  IN p_id INT UNSIGNED,
  IN p_producer_id INT UNSIGNED,
  IN p_delivery_time DATETIME,
  IN p_delivery_agent_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE order_details
SET producer_id = p_producer_id,
    delivery_time = p_delivery_time,
    delivery_agent_id = p_delivery_agent_id,
    status = p_status,
    updated_at = p_updated_at
WHERE id = p_id;
CREATE PROCEDURE sp_update_order_status(
  IN p_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE order_details
SET status = p_status, updated_at = p_updated_at
WHERE id = p_id;
CREATE PROCEDURE sp_confirm_order_delivery(
  IN p_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_delivered_qty INT UNSIGNED,
  IN p_loss_qty INT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE order_details
SET status = p_status,
    delivered_qty = p_delivered_qty,
    loss_qty = p_loss_qty,
    updated_at = p_updated_at
WHERE id = p_id;
CREATE PROCEDURE sp_delete_order(IN p_id INT UNSIGNED)
BEGIN
  DECLARE v_order_id INT UNSIGNED;
  DECLARE v_detail_count INT UNSIGNED;

  SELECT order_id INTO v_order_id FROM order_details WHERE id = p_id LIMIT 1;
  DELETE FROM order_details WHERE id = p_id;
  IF v_order_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_detail_count FROM order_details WHERE order_id = v_order_id;
    IF v_detail_count = 0 THEN
      DELETE FROM orders WHERE id = v_order_id;
    END IF;
  END IF;
  SELECT ROW_COUNT() AS affectedRows;
END;
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
CREATE PROCEDURE sp_create_province(
  IN p_name VARCHAR(120),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO provinces (name, updated_at)
  VALUES (p_name, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;
CREATE PROCEDURE sp_update_province(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(120),
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE provinces
  SET name = p_name, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;
CREATE PROCEDURE sp_delete_province(IN p_id INT UNSIGNED, IN p_updated_at DATETIME)
BEGIN
  UPDATE provinces SET is_active = 0, updated_at = p_updated_at WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;
CREATE PROCEDURE sp_create_customer(
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_depot_id INT UNSIGNED,
  IN p_province_id INT UNSIGNED,
  IN p_latitude DECIMAL(10,7),
  IN p_longitude DECIMAL(10,7),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customers (name, phone, depot_id, province_id, latitude, longitude, updated_at)
  VALUES (p_name, p_phone, p_depot_id, p_province_id, p_latitude, p_longitude, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;
CREATE PROCEDURE sp_update_customer(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_depot_id INT UNSIGNED,
  IN p_province_id INT UNSIGNED,
  IN p_latitude DECIMAL(10,7),
  IN p_longitude DECIMAL(10,7),
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE customers
  SET name = p_name, phone = p_phone, depot_id = p_depot_id, province_id = p_province_id, latitude = p_latitude, longitude = p_longitude, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;
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
END;
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

SET FOREIGN_KEY_CHECKS = 1;
