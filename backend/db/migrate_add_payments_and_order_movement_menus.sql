-- Idempotent: safe to run multiple times.
-- Adds sidebar menu keys for Payments (/payments) and Order movement (/order-movement).
-- Role ids assume default seed: 1=Admin, 2=Owner, 6=Depot (adjust if your roles table differs).

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'orderMovement'
FROM roles r
WHERE r.name IN ('Admin', 'Owner')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'payments'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);
