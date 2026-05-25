-- Idempotent PayWay upgrade (mirrors schema.mysql55.sql section 23).
-- Used by ensurePaywaySchema on server start and npm run db:migrate:payway.

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'payway',
  payway_tran_id VARCHAR(20) NOT NULL,
  provider_tran_id VARCHAR(64) NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KHR',
  status ENUM('pending', 'paid', 'failed', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_option VARCHAR(32) NULL,
  checkout_url TEXT NULL,
  deeplink_url TEXT NULL,
  raw_create_response LONGTEXT NULL,
  raw_callback_payload LONGTEXT NULL,
  verified_at DATETIME NULL,
  paid_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_payway_tran_id (payway_tran_id),
  UNIQUE KEY uq_payments_idempotency_key (idempotency_key),
  KEY idx_payments_order_status (order_id, status),
  KEY idx_payments_customer_created (customer_id, created_at),
  KEY idx_payments_provider_tran (provider_tran_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id CHAR(36) NULL,
  event_key VARCHAR(128) NOT NULL,
  payload LONGTEXT NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME NULL,
  error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_webhook_event_key (event_key),
  KEY idx_payment_webhook_payment (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET @has_orders_payment_status := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'payment_status'
);
SET @sql_add_orders_payment_status := IF(
  @has_orders_payment_status = 0,
  "ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid','pending','paid','failed') NOT NULL DEFAULT 'unpaid' AFTER amount_total, ADD KEY idx_orders_payment_status (payment_status)",
  'SELECT 1'
);
PREPARE stmt_add_orders_payment_status FROM @sql_add_orders_payment_status;
EXECUTE stmt_add_orders_payment_status;
DEALLOCATE PREPARE stmt_add_orders_payment_status;

SET @fk_payment_webhook_name := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payment_webhook_events'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  LIMIT 1
);
SET @sql_drop_payment_webhook_fk := IF(
  @fk_payment_webhook_name IS NOT NULL,
  CONCAT('ALTER TABLE payment_webhook_events DROP FOREIGN KEY `', @fk_payment_webhook_name, '`'),
  'SELECT 1'
);
PREPARE stmt_drop_payment_webhook_fk FROM @sql_drop_payment_webhook_fk;
EXECUTE stmt_drop_payment_webhook_fk;
DEALLOCATE PREPARE stmt_drop_payment_webhook_fk;

ALTER TABLE payment_webhook_events
  MODIFY payment_id CHAR(36) NULL;

DROP PROCEDURE IF EXISTS sp_get_order_by_id;
DROP PROCEDURE IF EXISTS sp_list_orders;
DROP PROCEDURE IF EXISTS sp_dashboard_totals;
DROP PROCEDURE IF EXISTS sp_dashboard_currency_totals;

CREATE PROCEDURE sp_get_order_by_id(IN p_id INT UNSIGNED)
SELECT
  o.id, c.name AS customer_name, o.customer_id, o.item_id, o.currency, o.ordered_qty,
  o.delivered_qty, o.loss_qty, o.unit_price,
  o.producer_id, o.delivery_agent_id, o.delivery_time,
  o.amount_total, o.payment_status, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN delivery_agents da ON da.id = o.delivery_agent_id
WHERE o.id = p_id
LIMIT 1;

CREATE PROCEDURE sp_list_orders()
SELECT
  o.id, c.name AS customer_name, o.customer_id, o.item_id, o.currency, o.ordered_qty,
  o.delivered_qty, o.loss_qty, o.unit_price,
  o.producer_id, o.delivery_agent_id, o.delivery_time,
  o.amount_total, o.payment_status, s.name AS status, o.created_at, o.updated_at,
  c.phone AS customer_phone,
  c.latitude AS customer_latitude,
  c.longitude AS customer_longitude,
  p.name AS producer_name,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN items it ON it.id = o.item_id
INNER JOIN status s ON s.id = o.status
LEFT JOIN producers p ON p.id = o.producer_id
LEFT JOIN delivery_agents da ON da.id = o.delivery_agent_id
ORDER BY o.id DESC;

CREATE PROCEDURE sp_dashboard_totals()
SELECT
  (SELECT COUNT(*) FROM orders) AS orders,
  (SELECT COUNT(*) FROM producers WHERE is_active = 1) AS producers,
  (SELECT COUNT(*) FROM delivery_agents WHERE is_active = 1) AS deliveryAgents,
  (SELECT COALESCE(SUM(amount_total), 0) FROM orders) AS totalRevenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') AS totalCollected,
  0 AS totalDiscrepancy,
  (SELECT COALESCE(SUM(loss_qty), 0) FROM orders) AS totalLossQty,
  0 AS totalRemainingQty;

CREATE PROCEDURE sp_dashboard_currency_totals()
SELECT
  COALESCE(SUM(CASE WHEN o.currency = 'USD' THEN o.amount_total ELSE 0 END), 0) AS total_revenue_usd,
  COALESCE(SUM(CASE WHEN o.currency = 'KHR' THEN o.amount_total ELSE 0 END), 0) AS total_revenue_khr,
  COALESCE(SUM(CASE WHEN p.currency = 'USD' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_collected_usd,
  COALESCE(SUM(CASE WHEN p.currency = 'KHR' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_collected_khr
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'paid';
