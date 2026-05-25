-- Idempotent delivery quantity upgrade (delivered_qty, loss_qty on orders).
-- Used by ensureDeliveryQtySchema on server start and npm run db:migrate:delivery-qty.

SET @has_delivered_qty := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'delivered_qty'
);
SET @sql_add_delivered_qty := IF(
  @has_delivered_qty = 0,
  'ALTER TABLE orders ADD COLUMN delivered_qty INT UNSIGNED NULL AFTER ordered_qty',
  'SELECT 1'
);
PREPARE stmt_add_delivered_qty FROM @sql_add_delivered_qty;
EXECUTE stmt_add_delivered_qty;
DEALLOCATE PREPARE stmt_add_delivered_qty;

SET @has_loss_qty := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'loss_qty'
);
SET @sql_add_loss_qty := IF(
  @has_loss_qty = 0,
  'ALTER TABLE orders ADD COLUMN loss_qty INT UNSIGNED NULL AFTER delivered_qty',
  'SELECT 1'
);
PREPARE stmt_add_loss_qty FROM @sql_add_loss_qty;
EXECUTE stmt_add_loss_qty;
DEALLOCATE PREPARE stmt_add_loss_qty;

DROP PROCEDURE IF EXISTS sp_confirm_order_delivery;
DROP PROCEDURE IF EXISTS sp_get_order_by_id;
DROP PROCEDURE IF EXISTS sp_list_orders;
DROP PROCEDURE IF EXISTS sp_dashboard_totals;

CREATE PROCEDURE sp_confirm_order_delivery(
  IN p_id INT UNSIGNED,
  IN p_status TINYINT UNSIGNED,
  IN p_delivered_qty INT UNSIGNED,
  IN p_loss_qty INT UNSIGNED,
  IN p_updated_at DATETIME
)
UPDATE orders
SET status = p_status,
    delivered_qty = p_delivered_qty,
    loss_qty = p_loss_qty,
    updated_at = p_updated_at
WHERE id = p_id;

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
