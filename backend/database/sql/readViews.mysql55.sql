-- Read views (included in schema.mysql55.sql bootstrap + runtime upgrade).

DROP VIEW IF EXISTS v_dashboard_currency_totals;
DROP VIEW IF EXISTS v_dashboard_totals;
DROP VIEW IF EXISTS v_dashboard_status_summary;
DROP VIEW IF EXISTS v_borrow_material_monthly_installments;
DROP VIEW IF EXISTS v_borrow_material_monthly_schedules;
DROP VIEW IF EXISTS v_borrow_material_order_loans;
DROP VIEW IF EXISTS v_customer_borrowed_materials;
DROP VIEW IF EXISTS v_borrow_materials;
DROP VIEW IF EXISTS v_role_menus;
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
  u.delivery_agent_id
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
  d.owner_user_id,
  ou.name AS owner_user_name,
  d.depot_user_id,
  du.name AS depot_user_name,
  d.created_at
FROM depots d
INNER JOIN users ou ON ou.id = d.owner_user_id
LEFT JOIN users du ON du.id = d.depot_user_id
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
  d.owner_user_id AS depot_owner_user_id,
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
  om.depot_batch_id,
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
    WHEN EXISTS (SELECT 1 FROM payment_with_aba a WHERE a.order_id = om.id)
      OR EXISTS (SELECT 1 FROM payment_with_khqr k WHERE k.order_id = om.id) THEN 'pending'
    ELSE 'unpaid'
  END AS payment_status,
  s.name AS status,
  od.created_at,
  od.updated_at,
  c.phone AS customer_phone,
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
LEFT JOIN producers p ON p.id = od.producer_id
LEFT JOIN delivery_agents da ON da.id = od.delivery_agent_id;

CREATE VIEW v_statuses AS
SELECT id, name
FROM status;

CREATE VIEW v_roles AS
SELECT id, name
FROM roles;

CREATE VIEW v_role_menus AS
SELECT r.name AS role_name, rm.menu_key, rm.role_id
FROM role_menus rm
INNER JOIN roles r ON r.id = rm.role_id;

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
  (SELECT COALESCE(SUM(amount_total), 0) FROM order_details) AS totalRevenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments) AS totalCollected,
  0 AS totalDiscrepancy,
  (SELECT COALESCE(SUM(loss_qty), 0) FROM order_details) AS totalLossQty,
  0 AS totalRemainingQty;

CREATE VIEW v_dashboard_currency_totals AS
SELECT
  COALESCE(SUM(CASE WHEN od.currency = 'USD' THEN od.amount_total ELSE 0 END), 0) AS total_revenue_usd,
  COALESCE(SUM(CASE WHEN od.currency = 'KHR' THEN od.amount_total ELSE 0 END), 0) AS total_revenue_khr,
  COALESCE(SUM(CASE WHEN p.currency = 'USD' THEN p.amount ELSE 0 END), 0) AS total_collected_usd,
  COALESCE(SUM(CASE WHEN p.currency = 'KHR' THEN p.amount ELSE 0 END), 0) AS total_collected_khr
FROM order_details od
LEFT JOIN orders om ON om.id = od.order_id
LEFT JOIN payments p ON p.order_id = om.id;
