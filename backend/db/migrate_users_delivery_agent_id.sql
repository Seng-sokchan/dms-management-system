-- Idempotent migration: link Delivery-role logins to delivery_agents via users.delivery_agent_id.
-- Safe to run multiple times. Run after delivery_agents exists.

-- 1) Column
SET @has_users_delivery_agent_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'delivery_agent_id'
);
SET @sql_add_users_delivery_agent_id := IF(
  @has_users_delivery_agent_id = 0,
  'ALTER TABLE users ADD COLUMN delivery_agent_id INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt_add_users_delivery_agent_id FROM @sql_add_users_delivery_agent_id;
EXECUTE stmt_add_users_delivery_agent_id;
DEALLOCATE PREPARE stmt_add_users_delivery_agent_id;

-- 2) Unique index (nullable: multiple NULLs allowed)
SET @has_uq_users_delivery_agent_id := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'uq_users_delivery_agent_id'
);
SET @sql_uq_users_delivery_agent_id := IF(
  @has_uq_users_delivery_agent_id = 0,
  'ALTER TABLE users ADD UNIQUE KEY uq_users_delivery_agent_id (delivery_agent_id)',
  'SELECT 1'
);
PREPARE stmt_uq_users_delivery_agent_id FROM @sql_uq_users_delivery_agent_id;
EXECUTE stmt_uq_users_delivery_agent_id;
DEALLOCATE PREPARE stmt_uq_users_delivery_agent_id;

-- 3) Foreign key
SET @has_fk_users_delivery_agent := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND constraint_name = 'fk_users_delivery_agent'
);
SET @sql_fk_users_delivery_agent := IF(
  @has_fk_users_delivery_agent = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_delivery_agent FOREIGN KEY (delivery_agent_id) REFERENCES delivery_agents (id)',
  'SELECT 1'
);
PREPARE stmt_fk_users_delivery_agent FROM @sql_fk_users_delivery_agent;
EXECUTE stmt_fk_users_delivery_agent;
DEALLOCATE PREPARE stmt_fk_users_delivery_agent;

-- 4) Procedures
DROP PROCEDURE IF EXISTS sp_set_delivery_agent_user_link;
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

DROP PROCEDURE IF EXISTS sp_get_user_by_username;
CREATE PROCEDURE sp_get_user_by_username(IN p_username VARCHAR(60))
SELECT u.id, u.name, u.username, u.password_hash, r.name AS role, u.delivery_agent_id
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.username = p_username AND u.is_active = 1
LIMIT 1;

DROP PROCEDURE IF EXISTS sp_get_user_by_id;
CREATE PROCEDURE sp_get_user_by_id(IN p_id INT UNSIGNED)
SELECT u.id, u.name, u.username, r.name AS role, u.is_active, u.customer_id, u.delivery_agent_id
FROM users u
INNER JOIN roles r ON r.id = u.role_id
WHERE u.id = p_id
LIMIT 1;

DROP PROCEDURE IF EXISTS sp_list_users;
CREATE PROCEDURE sp_list_users()
SELECT u.id, u.name, u.username, r.name AS role, u.is_active, u.customer_id, u.delivery_agent_id
FROM users u
INNER JOIN roles r ON r.id = u.role_id
ORDER BY u.id DESC;
