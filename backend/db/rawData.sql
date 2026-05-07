-- Seed customers + addresses from provided list
-- Rule applied:
-- - addresses.name = left-side location text (format like "គ.ម 50")
-- - customers.phone = provided phone text (if there are two numbers, keep both in one value; do not split)
-- - customers.name = text inside (...) when present, otherwise addresses.name
--
-- Depots: name => depots.name, phone => depots.phone (empty string if omitted). Requires at least one
-- active Owner user for owner_user_id (typical after initDatabase: username owner).

START TRANSACTION;

SET @depot_owner_id := (
  SELECT u.id FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  WHERE r.name = 'Owner' AND u.is_active = 1
  ORDER BY u.id ASC LIMIT 1
);

-- 0) Default Ice catalog (matches initDatabase seed; safe if id 1 already exists)
INSERT INTO catalogs (id, name, note, is_active, updated_at)
VALUES (1, 'Ice', 'ទឹកកក / Ice', 1, NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  note = VALUES(note),
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

-- 0b) Ice items under catalog_id 1 (matches initDatabase)
INSERT INTO items (id, catalog_id, name, sku, is_active, updated_at) VALUES
  (1, 1, 'ប្លាស្ទិច គ្រាប់តូច ( 16kg )', 'ICE-PLA-S-16', 1, NOW()),
  (2, 1, 'ប្លាស្ទិច គ្រាប់ធំ ( 16kg )', 'ICE-PLA-L-16', 1, NOW()),
  (3, 1, 'បេ ស គ្រាប់តូច ( 20kg )', 'ICE-BS-S-20', 1, NOW()),
  (4, 1, 'បេ ស គ្រាប់ធំ ( 20kg )', 'ICE-BS-L-20', 1, NOW())
ON DUPLICATE KEY UPDATE
  catalog_id = VALUES(catalog_id),
  name = VALUES(name),
  sku = VALUES(sku),
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

-- 0c) Default producer (matches initDatabase)
INSERT INTO producers (id, name, phone, capacity_note, is_active, updated_at)
VALUES (1, 'Eva Premium Ice', '', 'Ice production / distribution', 1, NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  capacity_note = VALUES(capacity_note),
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

-- 1) Raw import data
DROP TEMPORARY TABLE IF EXISTS tmp_customer_seed;
CREATE TEMPORARY TABLE tmp_customer_seed (
  address_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(120) NULL,
  phone VARCHAR(30) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO tmp_customer_seed (address_name, customer_name, phone) VALUES
-- 1–30 (គ.ម … + ម៉ាត តាកែវ)
('គ.ម 48', 'គ.ម 48', '010 224477'),
('គ.ម 50', 'គ.ម 50', '010 658994'),
('គ.ម 50', 'នាងខ្មៅ', '010 328744'),
('គ.ម 52', 'ដើមធ្លក', '069 931150'),
('គ.ម 52', 'នូវ ឌីណា', '086 225094'),
('គ.ម 56', 'គ.ម 56', '096 9306507'),
('គ.ម 70', 'គ.ម 70', '068 632404'),
('ម៉ាត តាកែវ', 'ម៉ាត តាកែវ', '016 545646'),
('គ.ម 1 រ៉ា', 'គ.ម 1 រ៉ា', '0978131057'),
('គ.ម 3 រោងចក្រ', 'គ.ម 3 រោងចក្រ', '015438643'),
('គ.ម 4 ថាវី', 'គ.ម 4 ថាវី', '081 711897'),
('គ.ម 4 សត្យា', 'គ.ម 4 សត្យា', '010 987 460'),
('គ.ម 6 ស្រីមាស', 'គ.ម 6 ស្រីមាស', '087474602'),
('គ.ម 7 ម៉ាក់ ពន្លឺ', 'គ.ម 7 ម៉ាក់ ពន្លឺ', '096 2630623'),
('គ.ម 9 បង ណា', 'គ.ម 9 បង ណា', '0979451517'),
('គ.ម 54', 'គ.ម 54', '070 966 696'),
('គ.ម 55', 'គ.ម 55', '070 542424'),
('គ.ម 68', 'គ.ម 68', '086 418646'),
('គ.ម 80', 'គ.ម 80', '096 2788533'),
('គ.ម 82', 'គ.ម 82', '016 770708/087924439'),
('គ.ម 31', 'គ.ម 31', '096 9992721'),
('គ.ម 83', 'គ.ម 83', '097 5746614'),
('គ.ម 84', 'គ.ម 84', NULL),
('គ.ម 86', 'គ.ម 86', '0888858288'),
('គ.ម 90', 'គ.ម 90', '090525566'),
('គ.ម 91', 'គ.ម 91', '071 733 7471'),
('គ.ម 92', 'គ.ម 92', '088 680 9476'),
('គ.ម 95', 'គ.ម 95', '088 496 3857'),
('គ.ម 126', 'គ.ម 126', '088 8188990'),
('គ.ម 127', 'គ.ម 127', NULL),
-- 31–47
('អង្គរុន', 'អង្គរុន', '096 311 7787'),
('អង្គរកាថ្មី', 'អង្គរកាថ្មី', '010 556 464'),
('ក្បាលខ្មោច', 'ក្បាលខ្មោច', '010 73 77 55 / 088 333 43 43'),
('មុន្នីរស្សី', 'មុន្នីរស្សី', '096 922 2707'),
('សំរោង', 'សំរោង', '097 925 2937'),
('សំរោង (ថ្មី)', 'សំរោង (ថ្មី)', '097 466 1993'),
('អង្ករកា', 'អង្ករកា', '088 2464 349'),
('ត្រពាំងធំ', 'ត្រពាំងធំ', '088 550 8949'),
('ផ្សារចំបុី', 'ផ្សារចំបុី', '088 8559394'),
('ផ្សារស្តុក', 'ផ្សារស្តុក', '088 555 9190'),
('ថ្មកែវ', 'ថ្មកែវ', '088 2159211'),
('គ្រូ ណាង', 'គ្រូ ណាង', '070 465926'),
('មុខសាលារៀន ត្រាំកក់', 'មុខសាលារៀន ត្រាំកក់', '067 466767'),
('រោងចក្រ គ.ម 89', 'រោងចក្រ គ.ម 89', '010 663 452'),
('វត្ត្តបាលីចាស់', 'វត្ត្តបាលីចាស់', '090 926 977'),
('អង្គរបុរី បាស្រែ', 'អង្គរបុរី បាស្រែ', '096 9294506'),
('អង្គរបុរី ទួលសាំង', 'អង្គរបុរី ទួលសាំង', '0972616565'),
-- Additional places (no phone in source)
('ស្ពានខ្ពស់', 'ស្ពានខ្ពស់', NULL),
('មាស', 'មាស', NULL),
('ម្រេះព្រៅ', 'ម្រេះព្រៅ', NULL),
('ព្រៃក្រាំង', 'ព្រៃក្រាំង', NULL),
('ស្នា.', 'ស្នា.', NULL),
('ថុល.', 'ថុល.', NULL),
('ដងទង់', 'ដងទង់', NULL),
('អុីម', 'អុីម', NULL),
('អង្គស្វាយ', 'អង្គស្វាយ', NULL),
('អ៉ីពៅ ខ/ត ដងទង់', 'អ៉ីពៅ ខ/ត ដងទង់', NULL),
('រ៉េត.  តូចស', 'រ៉េត.  តូចស', NULL),
('ស្រែជា តូចស', 'ស្រែជា តូចស', NULL),
('មុខវត្តធាយ តូចស', 'មុខវត្តធាយ តូចស', NULL),
('អង្គធាយ តូចស', 'អង្គធាយ តូចស', NULL),
('ត្រពាំងត្រាញ់ តូចស', 'ត្រពាំងត្រាញ់ តូចស', NULL),
('ចែពៅ កំបូលខ្ពស់', 'ចែពៅ កំបូលខ្ពស់', NULL),
('ពូអាត បានៀវ', 'ពូអាត បានៀវ', NULL),
('អ៉ីគីម បានៀវ', 'អ៉ីគីម បានៀវ', NULL),
('រចនា បានៀវ', 'រចនា បានៀវ', NULL),
('បានៀវ.', 'បានៀវ.', NULL),
('ពញ្ញាអង្គ តូច', 'ពញ្ញាអង្គ តូច', NULL),
('ក្តីចាស់ តូច', 'ក្តីចាស់ តូច', NULL),
('ត្រពាំងនៀល តូចស', 'ត្រពាំងនៀល តូចស', NULL),
('ក្រាំងលាវ', 'ក្រាំងលាវ', NULL),
('ផ្សារដងទង់ថ្មី', 'ផ្សារដងទង់ថ្មី', NULL),
('ផ្សារកោះចន្លុះ', 'ផ្សារកោះចន្លុះ', NULL),
('តាកែវ(វិមានឯករាជ្យ)', 'តាកែវ(វិមានឯករាជ្យ)', NULL),
('គ.ម 95 ដំណាក់រាជា', 'គ.ម 95 ដំណាក់រាជា', NULL),
('គ.ម 97', 'គ.ម 97', NULL),
('គ.ម 99 (ចាស់)', 'គ.ម 99 (ចាស់)', NULL),
('គ.ម 99 (ថ្មី)', 'គ.ម 99 (ថ្មី)', NULL),
('គ.ម 115 មុខឃ្លាំង', 'គ.ម 115 មុខឃ្លាំង', NULL);

-- 2) Insert addresses (only missing ones by name)
INSERT INTO addresses (name)
SELECT DISTINCT t.address_name
FROM tmp_customer_seed t
LEFT JOIN addresses a
  ON a.name = t.address_name
WHERE a.id IS NULL;

-- 3) Insert customers (avoid exact duplicates by name+phone+address)
INSERT INTO customers (name, phone, address, user_id, depot_id, updated_at)
SELECT
  t.customer_name,
  t.phone,
  a.id AS address_id,
  NULL AS user_id,
  NULL AS depot_id,
  NOW() AS updated_at
FROM tmp_customer_seed t
INNER JOIN addresses a
  ON a.name = t.address_name
WHERE NOT EXISTS (
  SELECT 1
  FROM customers c
  WHERE c.address = a.id
    AND (c.name <=> t.customer_name)
    AND (c.phone <=> t.phone)
);

-- 4) Insert depots (skip if same name already exists)
DROP TEMPORARY TABLE IF EXISTS tmp_depot_seed;
CREATE TEMPORARY TABLE tmp_depot_seed (
  depot_name VARCHAR(120) NOT NULL,
  depot_phone VARCHAR(30) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO tmp_depot_seed (depot_name, depot_phone) VALUES
('សំ ណុច', '088 633 3364'),
('ផា ស្រីនួន', NULL),
('ទឹម ងឿន', NULL),
('សុឹប ហ៊ា', NULL),
('ឡុង ភារុណ', NULL),
('ទោះ ធាវី', '088 751 2888'),
('ម៉ៅ ស្រី ភាស់', '097 891 3927'),
('សាត់ ភារម្យ', '031 888 4072'),
('កុម្ភះ', NULL),
('ស្រី អូន', NULL),
('ថែ ធឿន', NULL),
('អូន វាស្នា', NULL),
('ប្រាក់ នី', '097 752 6552'),
('ងួន ចន្ថា', NULL),
('បុត្រ', '098 441 979'),
('សុីណាត', NULL),
('នៅ សុខហេង', NULL),
('នាង សុខា', NULL);

INSERT INTO depots (name, phone, address, owner_user_id, depot_user_id, updated_at)
SELECT
  s.depot_name,
  COALESCE(NULLIF(TRIM(s.depot_phone), ''), ''),
  '',
  @depot_owner_id,
  NULL,
  NOW()
FROM tmp_depot_seed s
WHERE @depot_owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM depots d WHERE d.name = s.depot_name);

COMMIT;

-- Optional quick check
SELECT c.id, c.name, c.phone, a.name AS address_name
FROM customers c
JOIN addresses a ON a.id = c.address
ORDER BY c.id DESC;

-- Optional: depots
-- SELECT id, name, phone FROM depots WHERE is_active = 1 ORDER BY id ASC;
