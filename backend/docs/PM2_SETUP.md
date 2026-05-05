# PM2 Setup Guide (Backend Production)

This guide explains how to run the backend API with PM2 in a production-style setup.

## Prerequisites

- Node.js installed (`node -v`)
- npm installed (`npm -v`)
- Backend dependencies installed in `backend/`:

```bash
npm install
```

- Backend environment file configured:
  - `backend/.env` (copy from `.env.example` and fill values)

## 1) Install PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Verify:

```bash
pm2 -v
```

## 2) Start backend with PM2

From `backend/`, start the server entry file directly:

```bash
pm2 start src/server.js --name dms-backend --time
```

Why this command:
- On Windows, `pm2 start npm -- start` can fail due to argument parsing.
- Starting `src/server.js` directly is reliable.

## 3) Check process status

```bash
pm2 list
pm2 show dms-backend
```

Expected status: `online`

## 4) Logs and monitoring

Live logs:

```bash
pm2 logs dms-backend
```

Last 100 lines only:

```bash
pm2 logs dms-backend --lines 100
```

PM2 dashboard:

```bash
pm2 monit
```

## 5) Common operations

Restart:

```bash
pm2 restart dms-backend
```

Stop:

```bash
pm2 stop dms-backend
```

Delete process:

```bash
pm2 delete dms-backend
```

## 6) Persist after reboot

Save current process list:

```bash
pm2 save
```

Generate startup command:

```bash
pm2 startup
```

Run the command printed by PM2 (usually in an elevated shell), then save again:

```bash
pm2 save
```

## 7) Zero-downtime reload (future multi-instance)

If you later run cluster mode, use:

```bash
pm2 reload dms-backend
```

For current single fork mode, `restart` is typically used.

## 8) Troubleshooting

- `pm2: command not found`
  - Reinstall global PM2: `npm install -g pm2`
  - Re-open terminal so PATH reloads.

- App is `errored` in `pm2 list`
  - Check logs: `pm2 logs dms-backend --lines 200`
  - Verify `backend/.env` exists and required variables are set.
  - Verify backend dependencies are installed: `npm install`.

- Port already in use
  - Stop conflicting process or change backend port in `.env`.

## 9) Recommended production pair

- Backend: PM2 (`dms-backend`)
- Frontend: serve `frontend/dist` via Nginx (or equivalent static host)
- Reverse proxy (Nginx/Caddy/IIS) in front for HTTPS and domain routing
