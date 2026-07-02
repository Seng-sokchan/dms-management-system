-- Re-apply full root privileges (run manually if the DB volume already existed before init scripts).
-- Usage: sudo docker compose exec -T mariadb mariadb -u root -p"$DB_PASSWORD" < mariadb/grant-root-permissions.sql

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'::1' WITH GRANT OPTION;

GRANT ALL PRIVILEGES ON `fix_asset_db`.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON `fix_asset_db`.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON `fix_asset_db`.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON `fix_asset_db`.* TO 'root'@'::1' WITH GRANT OPTION;

FLUSH PRIVILEGES;
