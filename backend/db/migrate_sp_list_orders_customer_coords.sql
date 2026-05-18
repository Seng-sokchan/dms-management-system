-- Add customer latitude/longitude to sp_list_orders for mobile delivery navigation.
DROP PROCEDURE IF EXISTS sp_list_orders;

CREATE PROCEDURE sp_list_orders()
SELECT
  o.id, c.name AS customer_name, o.customer_id, o.order_group_id, og.name AS order_group_name, o.item_id, o.currency, o.ordered_qty, o.unit_price,
  o.producer_id, o.delivery_agent_id, o.delivery_time,
  o.amount_total, s.name AS status, o.created_at, o.updated_at,
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
LEFT JOIN order_groups og ON og.id = o.order_group_id
ORDER BY o.id DESC;
