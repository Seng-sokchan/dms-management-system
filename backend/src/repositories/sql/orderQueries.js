/** Shared SQL fragments for order_details + orders master joins. */

const PAYMENT_STATUS_EXPR = `
  CASE
    WHEN EXISTS (SELECT 1 FROM payments p WHERE p.order_id = om.id) THEN 'paid'
    ELSE 'unpaid'
  END`;

const ORDER_DETAIL_SELECT = `
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
  (${PAYMENT_STATUS_EXPR}) AS payment_status,
  s.name AS status,
  od.created_at,
  od.updated_at,
  c.phone AS customer_phone,
  p.name AS producer_name,
  da.name AS delivery_agent_name,
  it.name AS item_name,
  it.sku AS item_sku,
  EXISTS (
    SELECT 1 FROM special_day_deliveries sdd WHERE sdd.order_detail_id = od.id
  ) AS is_special_day`;

const ORDER_DETAIL_FROM = `
  FROM order_details od
  INNER JOIN orders om ON om.id = od.order_id
  INNER JOIN customers c ON c.id = od.customer_id
  INNER JOIN items it ON it.id = od.item_id
  INNER JOIN status s ON s.id = od.status
  LEFT JOIN producers p ON p.id = od.producer_id
  LEFT JOIN delivery_agents da ON da.id = od.delivery_agent_id`;

const ORDER_DETAIL_LIST_SELECT = `
  ${ORDER_DETAIL_SELECT},
  c.latitude AS customer_latitude,
  c.longitude AS customer_longitude`;

module.exports = {
  PAYMENT_STATUS_EXPR,
  ORDER_DETAIL_SELECT,
  ORDER_DETAIL_FROM,
  ORDER_DETAIL_LIST_SELECT,
};
