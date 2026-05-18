-- Grant customerOrderHistory menu to Admin, Owner, Depot, and Customer roles (idempotent).
INSERT INTO role_menus (role_id, menu_key)
SELECT r.id, 'customerOrderHistory'
FROM roles r
WHERE r.name IN ('Admin', 'Owner', 'Depot', 'Customer')
ON DUPLICATE KEY UPDATE menu_key = VALUES(menu_key);
