-- Runtime idempotent upgrades for legacy databases (not run on fresh db:init bootstrap).

-- Drop all legacy FOREIGN KEY constraints (canonical schema is indexes-only).
DROP PROCEDURE IF EXISTS sp_migrate_drop_foreign_keys;
CREATE PROCEDURE sp_migrate_drop_foreign_keys()
BEGIN
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_table VARCHAR(64);
  DECLARE v_fk VARCHAR(64);
  DECLARE cur CURSOR FOR
    SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS tc
    WHERE tc.TABLE_SCHEMA = DATABASE()
      AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  OPEN cur;
  fk_loop: LOOP
    FETCH cur INTO v_table, v_fk;
    IF v_done = 1 THEN
      LEAVE fk_loop;
    END IF;
    SET @drop_fk = CONCAT('ALTER TABLE `', v_table, '` DROP FOREIGN KEY `', v_fk, '`');
    PREPARE stmt_drop_fk FROM @drop_fk;
    EXECUTE stmt_drop_fk;
    DEALLOCATE PREPARE stmt_drop_fk;
  END LOOP;
  CLOSE cur;
END;

CALL sp_migrate_drop_foreign_keys();
DROP PROCEDURE IF EXISTS sp_migrate_drop_foreign_keys;

-- Menus + safe column cleanups
SET @has_role_menus := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'role_menus'
);
SET @sql_role_menus := IF(
  @has_role_menus = 0,
  'CREATE TABLE role_menus (
    role_id INT UNSIGNED NOT NULL,
    menu_key VARCHAR(40) NOT NULL,
    PRIMARY KEY (role_id, menu_key),
    KEY idx_role_menus_key (menu_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8',
  'SELECT 1'
);
PREPARE stmt_role_menus FROM @sql_role_menus;
EXECUTE stmt_role_menus;
DEALLOCATE PREPARE stmt_role_menus;

INSERT INTO role_menus (role_id, menu_key) VALUES
(1, 'overview'), (1, 'newOrder'), (1, 'catalogs'), (1, 'items'), (1, 'customerItemPrices'), (1, 'customers'), (1, 'trackingCustomerLocation'), (1, 'depots'), (1, 'provinces'), (1, 'customersByDepot'),
(1, 'producers'), (1, 'deliveryAgents'), (1, 'orders'), (1, 'assignOrders'), (1, 'orderMovement'), (1, 'payments'), (1, 'customerOrderHistory'), (1, 'users'), (1, 'borrowedMaterials'),
(2, 'overview'), (2, 'newOrder'), (2, 'catalogs'), (2, 'items'), (2, 'customerItemPrices'), (2, 'customers'), (2, 'trackingCustomerLocation'), (2, 'depots'), (2, 'provinces'), (2, 'customersByDepot'),
(2, 'producers'), (2, 'deliveryAgents'), (2, 'orders'), (2, 'assignOrders'), (2, 'orderMovement'), (2, 'payments'), (2, 'customerOrderHistory'), (2, 'borrowedMaterials'),
(3, 'overview'), (3, 'deliveryAgents'), (3, 'orders'),
(4, 'overview'), (4, 'orders'),
(5, 'overview'), (5, 'orders'), (5, 'customerOrderHistory'),
(6, 'overview'), (6, 'customers'), (6, 'trackingCustomerLocation'), (6, 'customersByDepot'), (6, 'customerItemPrices'), (6, 'orders'), (6, 'payments'), (6, 'customerOrderHistory'), (6, 'borrowedMaterials')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

-- Delivery agent live location
CREATE TABLE IF NOT EXISTS delivery_agent_locations (
  delivery_agent_id INT UNSIGNED NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(8,2) DEFAULT NULL,
  recorded_at DATETIME NOT NULL,
  PRIMARY KEY (delivery_agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Delivery quantities on line-item table (legacy)
SET @has_order_details_rt := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'order_details'
);
SET @line_table_rt := IF(@has_order_details_rt > 0, 'order_details', 'orders');

SET @has_delivered_qty_rt := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = @line_table_rt
    AND column_name = 'delivered_qty'
);
SET @sql_add_delivered_qty_rt := IF(
  @has_delivered_qty_rt = 0,
  CONCAT('ALTER TABLE ', @line_table_rt, ' ADD COLUMN delivered_qty INT UNSIGNED NULL AFTER ordered_qty'),
  'SELECT 1'
);
PREPARE stmt_add_delivered_qty_rt FROM @sql_add_delivered_qty_rt;
EXECUTE stmt_add_delivered_qty_rt;
DEALLOCATE PREPARE stmt_add_delivered_qty_rt;

SET @has_loss_qty_rt := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = @line_table_rt
    AND column_name = 'loss_qty'
);
SET @sql_add_loss_qty_rt := IF(
  @has_loss_qty_rt = 0,
  CONCAT('ALTER TABLE ', @line_table_rt, ' ADD COLUMN loss_qty INT UNSIGNED NULL AFTER delivered_qty'),
  'SELECT 1'
);
PREPARE stmt_add_loss_qty_rt FROM @sql_add_loss_qty_rt;
EXECUTE stmt_add_loss_qty_rt;
DEALLOCATE PREPARE stmt_add_loss_qty_rt;

-- Order master/detail split (legacy line-item orders table)
SET @has_order_details := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'order_details'
);
SET @sql_split_orders := IF(
  @has_order_details = 0,
  'RENAME TABLE orders TO order_details',
  'SELECT 1'
);
PREPARE stmt_split_orders FROM @sql_split_orders;
EXECUTE stmt_split_orders;
DEALLOCATE PREPARE stmt_split_orders;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  depot_batch_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_depot_batch_id (depot_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET @has_order_id_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'order_details' AND column_name = 'order_id'
);
SET @sql_add_order_id := IF(
  @has_order_id_col = 0,
  'ALTER TABLE order_details ADD COLUMN order_id INT UNSIGNED NULL AFTER id, ADD KEY idx_order_details_order_id (order_id)',
  'SELECT 1'
);
PREPARE stmt_add_order_id FROM @sql_add_order_id;
EXECUTE stmt_add_order_id;
DEALLOCATE PREPARE stmt_add_order_id;

DROP TABLE IF EXISTS payment_orders;

SET @has_od_payment_status := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'order_details' AND column_name = 'payment_status'
);
SET @sql_drop_od_payment_status := IF(
  @has_od_payment_status > 0,
  'ALTER TABLE order_details DROP COLUMN payment_status',
  'SELECT 1'
);
PREPARE stmt_drop_od_payment_status FROM @sql_drop_od_payment_status;
EXECUTE stmt_drop_od_payment_status;
DEALLOCATE PREPARE stmt_drop_od_payment_status;

SET @has_od_depot_batch := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'order_details' AND column_name = 'depot_batch_id'
);
SET @sql_drop_od_depot_batch := IF(
  @has_od_depot_batch > 0,
  'ALTER TABLE order_details DROP COLUMN depot_batch_id',
  'SELECT 1'
);
PREPARE stmt_drop_od_depot_batch FROM @sql_drop_od_depot_batch;
EXECUTE stmt_drop_od_depot_batch;
DEALLOCATE PREPARE stmt_drop_od_depot_batch;

CREATE TABLE IF NOT EXISTS payment_with_aba (
  id CHAR(36) NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  payway_tran_id VARCHAR(20) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KHR',
  deeplink_url TEXT NULL,
  checkout_url TEXT NULL,
  raw_create_response LONGTEXT NULL,
  return_params TEXT NULL,
  expires_at DATETIME NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_with_aba_payway_tran_id (payway_tran_id),
  UNIQUE KEY uq_payment_with_aba_idempotency_key (idempotency_key),
  KEY idx_payment_with_aba_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS payment_with_khqr (
  id CHAR(36) NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  payway_tran_id VARCHAR(20) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KHR',
  qr_string TEXT NULL,
  qr_image_url TEXT NULL,
  raw_create_response LONGTEXT NULL,
  return_params TEXT NULL,
  expires_at DATETIME NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_with_khqr_payway_tran_id (payway_tran_id),
  UNIQUE KEY uq_payment_with_khqr_idempotency_key (idempotency_key),
  KEY idx_payment_with_khqr_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Payment intents + success-only payments (legacy payments.status column)
DROP TABLE IF EXISTS payment_webhook_events;

SET @has_payments_status := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'status'
);

SET @sql_migrate_pending_aba := IF(
  @has_payments_status > 0,
  "INSERT IGNORE INTO payment_with_aba (
    id, order_id, customer_id, payway_tran_id, amount, currency,
    deeplink_url, checkout_url, raw_create_response, return_params,
    expires_at, idempotency_key, created_at, updated_at
  )
  SELECT
    p.id, p.order_id, p.customer_id, p.payway_tran_id, p.amount, p.currency,
    p.deeplink_url, p.checkout_url, p.raw_create_response, NULL,
    p.expires_at, p.idempotency_key, p.created_at, p.updated_at
  FROM payments p
  WHERE p.status = 'pending'
    AND (p.payment_option IS NULL OR LOWER(p.payment_option) NOT LIKE '%khqr%')",
  'SELECT 1'
);
PREPARE stmt_migrate_pending_aba FROM @sql_migrate_pending_aba;
EXECUTE stmt_migrate_pending_aba;
DEALLOCATE PREPARE stmt_migrate_pending_aba;

SET @sql_migrate_pending_khqr := IF(
  @has_payments_status > 0,
  "INSERT IGNORE INTO payment_with_khqr (
    id, order_id, customer_id, payway_tran_id, amount, currency,
    qr_string, qr_image_url, raw_create_response, return_params,
    expires_at, idempotency_key, created_at, updated_at
  )
  SELECT
    p.id, p.order_id, p.customer_id, p.payway_tran_id, p.amount, p.currency,
    NULL, p.checkout_url, p.raw_create_response, NULL,
    p.expires_at, p.idempotency_key, p.created_at, p.updated_at
  FROM payments p
  WHERE p.status = 'pending'
    AND LOWER(COALESCE(p.payment_option, '')) LIKE '%khqr%'",
  'SELECT 1'
);
PREPARE stmt_migrate_pending_khqr FROM @sql_migrate_pending_khqr;
EXECUTE stmt_migrate_pending_khqr;
DEALLOCATE PREPARE stmt_migrate_pending_khqr;

SET @sql_delete_non_paid_payments := IF(
  @has_payments_status > 0,
  "DELETE FROM payments WHERE status <> 'paid'",
  'SELECT 1'
);
PREPARE stmt_delete_non_paid_payments FROM @sql_delete_non_paid_payments;
EXECUTE stmt_delete_non_paid_payments;
DEALLOCATE PREPARE stmt_delete_non_paid_payments;

SET @drop_payments_status := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'status'
);
SET @sql_drop_payments_status := IF(
  @drop_payments_status > 0,
  'ALTER TABLE payments
     DROP COLUMN status,
     DROP COLUMN payment_option,
     DROP COLUMN checkout_url,
     DROP COLUMN deeplink_url,
     DROP COLUMN raw_create_response,
     DROP COLUMN expires_at,
     DROP COLUMN idempotency_key',
  'SELECT 1'
);
PREPARE stmt_drop_payments_status FROM @sql_drop_payments_status;
EXECUTE stmt_drop_payments_status;
DEALLOCATE PREPARE stmt_drop_payments_status;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'payway',
  payway_tran_id VARCHAR(20) NOT NULL,
  provider_tran_id VARCHAR(64) NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KHR',
  raw_callback_payload LONGTEXT NULL,
  verified_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_payway_tran_id (payway_tran_id),
  KEY idx_payments_order (order_id),
  KEY idx_payments_customer_created (customer_id, created_at),
  KEY idx_payments_provider_tran (provider_tran_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
