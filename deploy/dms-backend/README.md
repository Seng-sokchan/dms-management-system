# DMS Backend — Docker + PM2 on EC2

Standalone deploy project for running the API in Docker with PM2 (`pm2-runtime`) on AWS EC2. Application source lives in [`backend/`](../../backend/); this folder holds only deployment config.

Build context is the **repository root**; `.dockerignore` at the repo root excludes frontend, mobile-app, and other paths not needed for the API image.

## Architecture

- **Container**: Node 20 + PM2 running `backend/src/server.js`
- **MySQL / Redis**: native on the same EC2 host (not in this image)
- **Networking**: container uses `host.docker.internal` to reach host services

## Prerequisites (EC2)

1. Docker and Docker Compose plugin installed
2. MySQL and Redis running on the EC2 host
3. Security group allows port `4000` (or `443` only if using Nginx in front)
4. MySQL `bind-address` allows connections from the Docker bridge (not socket-only)
5. Redis `bind` allows host-gateway connections

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

Edit `.env` and set production values. For host MySQL/Redis:

```env
DB_HOST=host.docker.internal
REDIS_URL=redis://host.docker.internal:6379
```

### 3. Initialize database (once, on host)

Before the first API start, run schema init on the EC2 host (not inside the container):

```bash
cd backend
npm install
cp ../deploy/dms-backend/.env .env
npm run db:init
```

Use a host-reachable `DB_HOST` in that `.env` (e.g. `127.0.0.1` or the instance private IP), not `host.docker.internal`.

### 4. Build and run

```bash
cd deploy/dms-backend
docker compose build
docker compose up -d
```

### 5. Verify

```bash
docker compose ps
docker compose logs -f
curl http://localhost:4000/v1/health
```

Expected health response: `{"status":"ok"}`.

## Updates

After syncing `backend/` changes to EC2:

```bash
cd deploy/dms-backend
docker compose build --no-cache
docker compose up -d
```

## Common commands

| Action | Command |
|--------|---------|
| View logs | `docker compose logs -f` |
| Restart | `docker compose restart` |
| Stop | `docker compose down` |
| Shell into container | `docker compose exec backend sh` |

## Host connectivity check

Test that the container can reach the EC2 host:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway alpine ping -c 2 host.docker.internal
```

## Optional: Nginx reverse proxy

For HTTPS and domain routing, put Nginx in front of port `4000`. Enable WebSocket upgrade for Socket.IO. See [`backend/docs/PM2_SETUP.md`](../../backend/docs/PM2_SETUP.md) section 9.

## Troubleshooting

- **Container exits immediately** — check `docker compose logs`; verify `.env` has `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_NAME`.
- **Cannot connect to MySQL** — confirm MySQL listens on an address reachable from Docker; try `DB_HOST=host.docker.internal` and check EC2 security groups / local firewall.
- **Payments unreliable** — set `REDIS_URL` to host Redis; in-memory fallback only works for a single instance without Redis.

## Related docs

- Bare-metal PM2 (no Docker): [`backend/docs/PM2_SETUP.md`](../../backend/docs/PM2_SETUP.md)
- API reference: [`backend/docs/API_DOCS.md`](../../backend/docs/API_DOCS.md)
