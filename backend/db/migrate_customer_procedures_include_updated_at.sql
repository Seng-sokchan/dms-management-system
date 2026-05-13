-- Idempotent: safe to run multiple times.
-- Customer list/get procedures: updated_at + join users via users.customer_id (not customers.user_id).

DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
CREATE PROCEDURE sp_get_customer_by_id(IN p_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, u.id AS user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name, c.latitude, c.longitude, c.updated_at
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.id = p_id AND c.is_active = 1
LIMIT 1;

DROP PROCEDURE IF EXISTS sp_list_customers;
CREATE PROCEDURE sp_list_customers()
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, u.id AS user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name, c.latitude, c.longitude, c.updated_at
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.is_active = 1
ORDER BY c.id DESC;

DROP PROCEDURE IF EXISTS sp_list_customers_by_depot_id;
CREATE PROCEDURE sp_list_customers_by_depot_id(IN p_depot_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, u.id AS user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name, c.latitude, c.longitude, c.updated_at
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.customer_id = c.id
INNER JOIN depots d ON d.id = c.depot_id
WHERE c.is_active = 1 AND d.is_active = 1 AND c.depot_id = p_depot_id
ORDER BY c.id DESC;

DROP PROCEDURE IF EXISTS sp_list_customers_by_owner_user_id;
CREATE PROCEDURE sp_list_customers_by_owner_user_id(IN p_owner_user_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, u.id AS user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name, c.latitude, c.longitude, c.updated_at
FROM customers c
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE c.is_active = 1
  AND (
    c.depot_id IS NULL
    OR d.owner_user_id = p_owner_user_id
  )
ORDER BY c.id DESC;

-- Ensure Sent_To_Factory exists in status master data for staged owner handoff.
INSERT INTO status (name)
SELECT 'Sent_To_Factory'
WHERE NOT EXISTS (
  SELECT 1
  FROM status
  WHERE name = 'Sent_To_Factory'
);

-- Remove legacy New_Order and shift existing rows to Owner_Preparing.
SET @new_order_id := (
  SELECT id
  FROM status
  WHERE name = 'New_Order'
  LIMIT 1
);
SET @owner_preparing_id := (
  SELECT id
  FROM status
  WHERE name = 'Owner_Preparing'
  LIMIT 1
);

SET @sql_migrate_orders_new_order := IF(
  @new_order_id IS NOT NULL AND @owner_preparing_id IS NOT NULL,
  CONCAT('UPDATE orders SET status = ', @owner_preparing_id, ' WHERE status = ', @new_order_id),
  'SELECT 1'
);
PREPARE stmt_migrate_orders_new_order FROM @sql_migrate_orders_new_order;
EXECUTE stmt_migrate_orders_new_order;
DEALLOCATE PREPARE stmt_migrate_orders_new_order;

SET @sql_migrate_history_from_new_order := IF(
  @new_order_id IS NOT NULL AND @owner_preparing_id IS NOT NULL,
  CONCAT('UPDATE order_status_history SET from_status = ', @owner_preparing_id, ' WHERE from_status = ', @new_order_id),
  'SELECT 1'
);
PREPARE stmt_migrate_history_from_new_order FROM @sql_migrate_history_from_new_order;
EXECUTE stmt_migrate_history_from_new_order;
DEALLOCATE PREPARE stmt_migrate_history_from_new_order;

SET @sql_migrate_history_to_new_order := IF(
  @new_order_id IS NOT NULL AND @owner_preparing_id IS NOT NULL,
  CONCAT('UPDATE order_status_history SET to_status = ', @owner_preparing_id, ' WHERE to_status = ', @new_order_id),
  'SELECT 1'
);
PREPARE stmt_migrate_history_to_new_order FROM @sql_migrate_history_to_new_order;
EXECUTE stmt_migrate_history_to_new_order;
DEALLOCATE PREPARE stmt_migrate_history_to_new_order;

DELETE FROM status WHERE name = 'New_Order';
