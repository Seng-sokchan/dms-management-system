# DMS Backend — Docker + PM2 + Caddy + MariaDB on EC2

Standalone deploy project for running the API in Docker with PM2 (`pm2-runtime`) on AWS EC2. **Caddy** terminates HTTPS on `api.dmscambodia.com` and reverse-proxies to the backend. **MariaDB 12.2.2** runs as a Docker service with persistent storage.

Application source lives in [`backend/`](../../backend/); this folder holds only deployment config.

Build context is the **repository root**; `.dockerignore` at the repo root excludes frontend, mobile-app, and other paths not needed for the API image.

On EC2, run all Docker commands with **`sudo`** (install, update, exec, logs, etc.).

## Architecture

- **Caddy**: automatic HTTPS (Let's Encrypt) on `api.dmscambodia.com` → `backend:4000`
- **Backend**: Node.js 21.5.0 + PM2 running `backend/src/server.js` (internal only; reachable via Caddy)
- **MariaDB 12.2.2**: `mariadb` service, `root` user with full privileges on `*.*`, data in volume `mariadb_data`
- **Redis** (optional): native on the EC2 host, or add a Redis service later

## Prerequisites (EC2)

1. Docker and Docker Compose plugin installed
2. DNS **A record** for `api.dmscambodia.com` pointing to the EC2 public IP
3. Security group allows inbound **80** and **443** (TCP and UDP for HTTP/3)
4. (Optional) port **3306** if you need remote SQL access to MariaDB

## First-time setup

### 1. Copy files to EC2

Upload at minimum:

- `backend/` (application source)
- `deploy/dms-backend/` (this folder)

Or copy the full repository.

### 2. Configure environment

```bash
cd deploy/dms-backend
cp .env.example .env
```

Edit `.env` and set production values (`JWT_SECRET`, `ACME_EMAIL`, PayWay keys, etc.). Database defaults:

```env
DB_HOST=mariadb
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Lyheng@dm!n
DB_NAME=fix_asset_db
```

The backend container overrides `DB_HOST=mariadb` via `docker-compose.yml`. Use `127.0.0.1` only when running `db:init` from the EC2 host (see below).

Set `PAYWAY_CALLBACK_URL` and other PayWay URLs to `https://api.dmscambodia.com/...` in production.

Set `PAYMENT_CHECKOUT_TTL_MINUTES` (default `5`) to control how long an unpaid PayWay checkout session stays valid before expiring.

### 3. Start MariaDB, then initialize schema (once)

Start the database first:

```bash
cd deploy/dms-backend
sudo docker compose up -d mariadb
```

Wait until healthy (`sudo docker compose ps`), then run schema init **on the host** (MariaDB is published on port 3306):

```bash
cd backend
npm install
cp ../deploy/dms-backend/.env .env
# Use host-reachable DB_HOST for init (not the Docker service name)
DB_HOST=127.0.0.1 npm run db:init
```

Or temporarily set `DB_HOST=127.0.0.1` in `backend/.env` before `npm run db:init`.

### 4. Build and run full stack

```bash
cd deploy/dms-backend
sudo docker compose build
sudo docker compose up -d
```

Caddy obtains a certificate on first request once DNS resolves to this host.

### 5. Verify

```bash
sudo docker compose ps
sudo docker compose logs -f
curl https://api.dmscambodia.com/v1/health
```

Expected health response: `{"status":"ok"}`.

MariaDB shell:

```bash
sudo docker compose exec mariadb mariadb -u root -p'Lyheng@dm!n'
```

Internal health check (without going through Caddy):

```bash
sudo docker compose exec backend wget -qO- http://127.0.0.1:4000/v1/health
```

## Updates

After syncing `backend/` changes to EC2 (**required after the hardcoded rules change** — old images still query `role_menus` and will crash if that table is gone):

```bash
cd deploy/dms-backend
# Sync latest repo files first (git pull / copy), then:
sudo docker compose build --no-cache backend
sudo docker compose up -d --force-recreate backend
```

Confirm the new image no longer references menus under src:

```bash
sudo docker compose exec backend sh -c "grep -R -E 'roleMenus|ROLE_MENUS|v_role_menus' /app/src || true"
```

Expect **no output**. The image build runs `strip-legacy-rules.sh` to delete leftover `roleMenus.js` / related files if an old `backend/` copy was used.

On first start, `ensureRulesSchema` drops legacy rules tables if they still exist.

**Important:** rebuild context is the **repo root** (`backend/` + `deploy/dms-backend/`). Sync **both** folders (or `git pull` the full repo). Updating only `deploy/` while leaving an old `backend/` on the server will keep crashing until you rebuild with a clean backend tree.

Reload Caddy after editing `Caddyfile` only:

```bash
sudo docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Common commands

| Action | Command |
|--------|---------|
| View logs | `sudo docker compose logs -f` |
| MariaDB logs | `sudo docker compose logs -f mariadb` |
| Caddy logs | `sudo docker compose logs -f caddy` |
| Restart all | `sudo docker compose restart` |
| Stop | `sudo docker compose down` |
| Shell into backend | `sudo docker compose exec backend sh` |
| MariaDB CLI | `sudo docker compose exec mariadb mariadb -u root -p` |

## MariaDB

- Image: `mariadb:12.2.2`
- User: `root` / password from `DB_PASSWORD` in `.env`
- `MARIADB_ROOT_HOST=%` — root may connect from any host (backend container, host, tools)
- On **first start**, [`mariadb/init/01-grant-root.sh`](./mariadb/init/01-grant-root.sh) grants `ALL PRIVILEGES` on `*.*` and `fix_asset_db.*` to `root` for `%`, `localhost`, `127.0.0.1`, and `::1` (with `GRANT OPTION`)
- Data: Docker volume `mariadb_data` (survives `sudo docker compose down`; removed only with `sudo docker volume rm`)

Re-apply root grants on an **existing** volume (init scripts run only once):

```bash
cd deploy/dms-backend
sudo docker compose exec -T mariadb mariadb -u root -p'Lyheng@dm!n' < mariadb/grant-root-permissions.sql
```

## Caddy

- Config: [`Caddyfile`](./Caddyfile) — site block for `api.dmscambodia.com`
- Certificates: stored in Docker volume `caddy_data` (persisted across restarts)
- WebSocket / Socket.IO: handled automatically by Caddy `reverse_proxy`
- To use a different domain, edit `Caddyfile` and reload Caddy

## Troubleshooting

- **Container exits immediately** — check `sudo docker compose logs`; verify `.env` has `JWT_SECRET`, `DB_PASSWORD`, `DB_NAME`.
- **Backend cannot connect to MariaDB** — ensure `mariadb` is healthy (`sudo docker compose ps`); check `sudo docker compose logs mariadb`.
- **Payments unreliable** — set `REDIS_URL` to host Redis; in-memory fallback only works for a single instance without Redis.
- **Checkout expires too quickly** — adjust `PAYMENT_CHECKOUT_TTL_MINUTES` in `.env` (default `5`).
- **HTTPS / certificate errors** — confirm DNS for `api.dmscambodia.com` points to this server, ports 80/443 are open, and `ACME_EMAIL` is set in `.env`. Check `sudo docker compose logs caddy`.
- **502 from Caddy** — backend may still be starting; run `sudo docker compose logs backend`.
- **Admin login blocked / “Provisional headers” in DevTools** — CORS allowlist mismatch. Set `FRONTEND_URL=https://dmscambodia.com` (and usually the same for `MOBILE_URL`) in `.env`, then `sudo docker compose up -d --force-recreate backend`. Frontend must be built with `VITE_API_BASE_URL=https://api.dmscambodia.com/v1`.
- **`Table 'fix_asset_db.role_menus' doesn't exist` crash loop** — container is running an **old** backend that still loads DB menu rules after those tables were removed. Sync latest code, then rebuild with no cache (see Updates).

## Related docs

- Bare-metal PM2 (no Docker): [`backend/docs/PM2_SETUP.md`](../../backend/docs/PM2_SETUP.md)
- API reference: [`backend/docs/API_DOCS.md`](../../backend/docs/API_DOCS.md)
