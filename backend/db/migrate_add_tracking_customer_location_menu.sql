-- Idempotent: safe to run multiple times.
-- Adds sidebar menu key trackingCustomerLocation (/tracking-customer-location) for Admin, Owner, Depot.

INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'trackingCustomerLocation'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);
