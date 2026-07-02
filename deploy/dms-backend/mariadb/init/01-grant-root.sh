#!/bin/bash
# Runs on first init only (/docker-entrypoint-initdb.d). Grants root full access everywhere.
set -euo pipefail

DB="${MARIADB_DATABASE:-fix_asset_db}"

mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" <<-EOSQL
	GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON *.* TO 'root'@'::1' WITH GRANT OPTION;

	GRANT ALL PRIVILEGES ON \`${DB}\`.* TO 'root'@'%' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON \`${DB}\`.* TO 'root'@'localhost' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON \`${DB}\`.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
	GRANT ALL PRIVILEGES ON \`${DB}\`.* TO 'root'@'::1' WITH GRANT OPTION;

	FLUSH PRIVILEGES;
EOSQL
