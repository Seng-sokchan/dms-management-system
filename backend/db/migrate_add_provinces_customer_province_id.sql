-- Add province master data and link customers to provinces.
CREATE TABLE IF NOT EXISTS provinces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_provinces_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET @has_customer_province_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customers'
    AND column_name = 'province_id'
);
SET @sql_add_customer_province_id := IF(
  @has_customer_province_id = 0,
  'ALTER TABLE customers ADD COLUMN province_id INT UNSIGNED NULL AFTER depot_id, ADD KEY idx_customers_province_id (province_id)',
  'SELECT 1'
);
PREPARE stmt_add_customer_province_id FROM @sql_add_customer_province_id;
EXECUTE stmt_add_customer_province_id;
DEALLOCATE PREPARE stmt_add_customer_province_id;

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'provinces'
FROM roles r
WHERE r.name IN ('Admin', 'Owner')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

DROP PROCEDURE IF EXISTS sp_get_province_by_id;
DROP PROCEDURE IF EXISTS sp_list_provinces;
DROP PROCEDURE IF EXISTS sp_create_province;
DROP PROCEDURE IF EXISTS sp_update_province;
DROP PROCEDURE IF EXISTS sp_delete_province;

CREATE PROCEDURE sp_get_province_by_id(IN p_id INT UNSIGNED)
SELECT id, name
FROM provinces
WHERE id = p_id AND is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_provinces()
SELECT id, name
FROM provinces
WHERE is_active = 1
ORDER BY id DESC;

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

DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
DROP PROCEDURE IF EXISTS sp_list_customers;
DROP PROCEDURE IF EXISTS sp_list_customers_by_depot_id;
DROP PROCEDURE IF EXISTS sp_list_customers_by_owner_user_id;
DROP PROCEDURE IF EXISTS sp_get_customer_by_user_id;
DROP PROCEDURE IF EXISTS sp_create_customer;
DROP PROCEDURE IF EXISTS sp_update_customer;

CREATE PROCEDURE sp_get_customer_by_id(IN p_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, u.id AS user_id, u.name AS user_name, u.username AS user_username,
       c.depot_id, d.name AS depot_name, c.province_id, p.name AS province_name,
       c.latitude, c.longitude, c.updated_at
FROM customers c
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
WHERE c.id = p_id AND c.is_active = 1
LIMIT 1;

CREATE PROCEDURE sp_list_customers()
SELECT c.id, c.name, c.phone, u.id AS user_id, u.name AS user_name, u.username AS user_username,
       c.depot_id, d.name AS depot_name, c.province_id, p.name AS province_name,
       c.latitude, c.longitude, c.updated_at
FROM customers c
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
WHERE c.is_active = 1
ORDER BY c.id DESC;

CREATE PROCEDURE sp_list_customers_by_depot_id(IN p_depot_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, u.id AS user_id, u.name AS user_name, u.username AS user_username,
       c.depot_id, d.name AS depot_name, c.province_id, p.name AS province_name,
       c.latitude, c.longitude, c.updated_at
FROM customers c
LEFT JOIN users u ON u.customer_id = c.id
INNER JOIN depots d ON d.id = c.depot_id
LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
WHERE c.is_active = 1 AND d.is_active = 1 AND c.depot_id = p_depot_id
ORDER BY c.id DESC;

CREATE PROCEDURE sp_list_customers_by_owner_user_id(IN p_owner_user_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, u.id AS user_id, u.name AS user_name, u.username AS user_username,
       c.depot_id, d.name AS depot_name, c.province_id, p.name AS province_name,
       c.latitude, c.longitude, c.updated_at
FROM customers c
LEFT JOIN users u ON u.customer_id = c.id
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
WHERE c.is_active = 1
  AND (
    c.depot_id IS NULL
    OR d.owner_user_id = p_owner_user_id
  )
ORDER BY c.id DESC;

CREATE PROCEDURE sp_get_customer_by_user_id(IN p_user_id INT UNSIGNED)
SELECT c.id, c.name, c.phone, u.id AS user_id, u.name AS user_name, u.username AS user_username,
       c.depot_id, d.name AS depot_name, c.province_id, p.name AS province_name,
       c.latitude, c.longitude, c.updated_at
FROM users u
INNER JOIN customers c ON c.id = u.customer_id AND c.is_active = 1
LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
LEFT JOIN provinces p ON p.id = c.province_id AND p.is_active = 1
WHERE u.id = p_user_id AND u.is_active = 1
LIMIT 1;

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
  SET name = p_name,
      phone = p_phone,
      depot_id = p_depot_id,
      province_id = p_province_id,
      latitude = p_latitude,
      longitude = p_longitude,
      updated_at = p_updated_at
  WHERE id = p_id AND is_active = 1;
  SELECT ROW_COUNT() AS affectedRows;
END;
