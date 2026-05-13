-- Idempotent migration: move customer-login link from customers.user_id to users.customer_id.
-- Safe to run multiple times. After this, apply procedure definitions (below) if your DB
-- was created before users.customer_id (or run full schema.mysql55.sql procedure section).

-- 1) users.customer_id + unique index
SET @has_users_customer_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'customer_id'
);
SET @sql_add_users_customer_id := IF(
  @has_users_customer_id = 0,
  'ALTER TABLE users ADD COLUMN customer_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_users_customer_id FROM @sql_add_users_customer_id;
EXECUTE stmt_add_users_customer_id;
DEALLOCATE PREPARE stmt_add_users_customer_id;

SET @has_uq_users_customer_id := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'uq_users_customer_id'
);
SET @sql_uq_users_customer_id := IF(
  @has_uq_users_customer_id = 0,
  'ALTER TABLE users ADD UNIQUE KEY uq_users_customer_id (customer_id)',
  'SELECT 1'
);
PREPARE stmt_uq_users_customer_id FROM @sql_uq_users_customer_id;
EXECUTE stmt_uq_users_customer_id;
DEALLOCATE PREPARE stmt_uq_users_customer_id;

-- 2) Backfill from legacy customers.user_id then drop column
SET @has_customers_user_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'user_id'
);
SET @sql_backfill_customer_link := IF(
  @has_customers_user_id > 0,
  'UPDATE users u INNER JOIN customers c ON c.user_id = u.id SET u.customer_id = c.id WHERE c.user_id IS NOT NULL',
  'SELECT 1'
);
PREPARE stmt_backfill_customer_link FROM @sql_backfill_customer_link;
EXECUTE stmt_backfill_customer_link;
DEALLOCATE PREPARE stmt_backfill_customer_link;

SET @sql_drop_customers_user_id := IF(
  @has_customers_user_id > 0,
  'ALTER TABLE customers DROP COLUMN user_id',
  'SELECT 1'
);
PREPARE stmt_drop_customers_user_id FROM @sql_drop_customers_user_id;
EXECUTE stmt_drop_customers_user_id;
DEALLOCATE PREPARE stmt_drop_customers_user_id;

-- 3) Procedures aligned with users.customer_id
DROP PROCEDURE IF EXISTS sp_get_user_by_id;
CREATE PROCEDURE sp_get_user_by_id(IN p_id INT UNSIGNED)
SELECT u.id, u.name, u.username, r.name AS role, u.is_active, u.customer_id
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.id = p_id
LIMIT 1;

DROP PROCEDURE IF EXISTS sp_list_users;
CREATE PROCEDURE sp_list_users()
SELECT u.id, u.name, u.username, r.name AS role, u.is_active, u.customer_id
FROM users u
INNER JOIN roles r ON r.id = u.role_id
ORDER BY u.id DESC;

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

DROP PROCEDURE IF EXISTS sp_get_customer_by_user_id;
CREATE PROCEDURE sp_get_customer_by_user_id(IN p_user_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, c.address, a.name AS address_name, u.id AS user_id, u.name AS user_name, u.username AS user_username, c.depot_id, d.name AS depot_name, c.latitude, c.longitude, c.updated_at
FROM users u
INNER JOIN customers c ON c.id = u.customer_id AND c.is_active = 1
INNER JOIN addresses a ON a.id = c.address
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
WHERE u.id = p_user_id AND u.is_active = 1
LIMIT 1;

DROP PROCEDURE IF EXISTS sp_set_customer_user_link;
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

DROP PROCEDURE IF EXISTS sp_create_customer;
CREATE PROCEDURE sp_create_customer(
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_address INT UNSIGNED,
  IN p_depot_id INT UNSIGNED,
  IN p_latitude DECIMAL(10,7),
  IN p_longitude DECIMAL(10,7),
  IN p_updated_at DATETIME
)
BEGIN
  INSERT INTO customers (name, phone, address, depot_id, latitude, longitude, updated_at)
  VALUES (p_name, p_phone, p_address, p_depot_id, p_latitude, p_longitude, p_updated_at);
  SELECT LAST_INSERT_ID() AS insertId;
END;

DROP PROCEDURE IF EXISTS sp_update_customer;
CREATE PROCEDURE sp_update_customer(
  IN p_id INT UNSIGNED,
  IN p_name VARCHAR(255),
  IN p_phone VARCHAR(30),
  IN p_address INT UNSIGNED,
  IN p_depot_id INT UNSIGNED,
  IN p_latitude DECIMAL(10,7),
  IN p_longitude DECIMAL(10,7),
  IN p_updated_at DATETIME
)
BEGIN
  UPDATE customers
  SET name = p_name, phone = p_phone, address = p_address, depot_id = p_depot_id, latitude = p_latitude, longitude = p_longitude, updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;
