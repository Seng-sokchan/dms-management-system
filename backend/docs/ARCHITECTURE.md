# Backend Architecture

This document describes the layered architecture of the DMS backend, the
responsibility of each folder, and the conventions to follow when adding new
features. The stack is **Node.js + Express 5 + MySQL (mysql2/promise) + Zod**.

---

## 1. High-level layering

A request flows top-down through these layers:

```
HTTP request
    │
    ▼
routes/            ── declares the URL → handler mapping
    │
    ▼
middleware/        ── auth, rate-limit, logging, response shaping
    │
    ▼
validators/        ── Zod schemas + validate() middleware
    │
    ▼
controllers/       ── thin HTTP layer: parse req, call service, send response
    │
    ▼
services/          ── business rules, orchestration, transactions
    │
    ▼
repositories/      ── SQL queries; the ONLY layer that talks to the DB
    │
    ▼
database/pool.js   ── shared mysql2 connection pool
```

Each layer only depends on layers below it. Controllers must not run SQL,
repositories must not return HTTP responses, and so on.

---

## 2. Project layout

| Folder | Purpose |
|--------|---------|
| `database/` | SQL schema, runtime migrations, connection pool, init/migrate scripts |
| `src/` | HTTP application layers (routes → controllers → services → repositories) |
| `docs/` | Architecture, API reference, coding standards, deployment notes |
| `scripts/` | Developer tooling (schema export/rebuild) |

`database/` holds everything that touches MySQL schema or connections. `src/` holds
the Express app and must not contain SQL files.

---

## 3. Folder map

```
backend/
├── docs/
│   ├── ARCHITECTURE.md        ← this file
│   ├── API_DOCS.md            ← endpoint reference
│   ├── CODING_STANDARDS.md
│   ├── REFACTOR_PLAN.md
│   └── PM2_SETUP.md
├── database/
│   ├── sql/
│   │   ├── schema.mysql55.sql       ← canonical schema (fresh db:init)
│   │   ├── runtimeUpgrade.mysql55.sql
│   │   └── readViews.mysql55.sql
│   ├── pool.js                      ← getPool(), checkDbConnection()
│   ├── schemaLoader.js              ← reads SQL files
│   ├── ensureSchema.js              ← startup migration (server.js)
│   ├── init.js                      ← npm run db:init
│   ├── migrate.js                   ← npm run db:migrate
│   └── backfillOrderMasters.js
├── scripts/
│   ├── export-db-ddl.js
│   └── rebuild-schema.js
├── package.json
└── src/
    ├── server.js              ← entry point: validates env, starts HTTP server
    ├── app.js                 ← Express app: middleware chain + route mounting
    │
    ├── config/
    │   └── env.js             ← validated, frozen env object
    │
    ├── constants/
    │   ├── general.js
    │   ├── roleMenus.js
    │   └── index.js
    │
    ├── routes/
    │   ├── index.js
    │   ├── healthRoutes.js
    │   ├── authRoutes.js
    │   ├── webhookRoutes.js
    │   └── groups/
    │       ├── masterDataRoutes.js
    │       ├── opsRoutes.js
    │       ├── adminRoutes.js
    │       ├── masterData/    ← catalogs, items, depots, …
    │       ├── ops/           ← orders, payments, customers, …
    │       └── admin/         ← users, role menus
    │
    ├── middleware/
    ├── validators/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── integrations/payway/
    ├── socket/
    ├── jobs/
    ├── errors/
    └── utils/
```

---

## 4. Layer responsibilities

### `routes/`
Pure URL → handler wiring. Each file exports an `express.Router()`. Apply
`validate(...)` and `auth(...)` middleware here, *not* inside controllers.

```js
router.post(
  "/orders",
  auth,
  validate({ body: createOrderSchema }),
  asyncHandler(orderController.create),
);
```

### `controllers/`
HTTP-aware glue. A controller pulls validated data off `req`, calls a service,
shapes the response with a DTO, and returns it via `success(res, …)`. Controllers
must not import from `repositories/` directly.

### `services/`
Business logic and orchestration. Services compose multiple repositories,
enforce invariants (e.g. valid status transitions), and run transactions.
Throw `AppError` subclasses to signal expected failure modes.

### `repositories/`
The only layer that runs SQL. One file per aggregate root. Every function
returns plain JS objects (or `null` / arrays); no Express objects, no thrown
HTTP errors. Use the shared pool:

```js
const { getPool } = require("../../database/pool");
async function findById(id) {
  const [rows] = await getPool().query("SELECT * FROM orders WHERE id = ?", [id]);
  return rows[0] || null;
}
```

### `validators/`
Zod schemas + the `validate()` middleware factory. After `validate()` runs,
`req.body` / `req.query` / `req.params` are guaranteed to match the schema and
have been coerced/defaulted, so downstream code can trust them.

### `dtos/`
Pure functions that map repository rows (or service results) into the public
API response shape. Strip secrets here. Keeps DB and API schemas decoupled.

### `errors/`
- `AppError` — base operational error with `status`, `code`, `details`.
- `HttpErrors` — convenience subclasses (`NotFoundError`, `ForbiddenError`, …).
- `asyncHandler(fn)` — wraps async route handlers so rejections reach the
  global `errorHandler` middleware automatically.

### `middleware/`
Cross-cutting concerns. `errorHandler` is mounted last in `app.js` and
translates any thrown `AppError` into the standard error envelope.

### `utils/`
Stateless helpers only. If something needs DB or env access, it belongs in a
service or repository.

### `config/`
- `env.js` — validates required variables on boot, exports a frozen `env`
  object. Always import config from here, never read `process.env` ad-hoc.

### `database/`
- `pool.js` — shared mysql2 connection pool (`getPool`, `checkDbConnection`).
- `sql/` — canonical schema and idempotent runtime upgrade scripts.
- `init.js` / `migrate.js` — CLI scripts (`npm run db:init`, `npm run db:migrate`).
- `ensureSchema.js` — called on server startup to apply runtime upgrades.

---

## 5. Standard response envelope

Every endpoint returns one of two shapes via the helpers in `utils/response.js`:

```jsonc
// Success
{ "success": true, "data": { … }, "meta": { /* optional */ } }

// Failure (produced by errorHandler from a thrown AppError)
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Order not found" } }
```

This makes the frontend's response parsing trivial: check `success`, then read
`data` or `error`.

---

## 6. Adding a new feature — checklist

Suppose you're adding **Promotions**. Create files in this order:

1. `database/sql/schema.mysql55.sql` — add the `promotions` table.
2. `src/repositories/promotions.js` — `findAll`, `findById`, `insert`, `update`, `remove`.
3. `src/validators/promotion.validator.js` — Zod schemas for create/update/listQuery.
4. `src/dtos/promotion.dto.js` — `toPromotionDto(row)`.
5. `src/services/promotionService.js` — business rules (e.g. "no overlapping promos").
6. `src/controllers/promotionController.js` — thin handlers using `asyncHandler`.
7. `src/routes/groups/<group>/promotionRoutes.js` — wire URLs, mount validators + auth.
8. Register the router in the appropriate `groups/*Routes.js` barrel.
9. Document the endpoints in `docs/API_DOCS.md`.

---

## 7. Conventions

- **CommonJS** (`require` / `module.exports`) — the project is not on ESM yet.
- **Naming** — files are `camelCase.js`; classes are `PascalCase`; SQL columns
  are `snake_case` and mapped to camelCase inside DTOs.
- **Async** — every controller is wrapped in `asyncHandler`. No bare `try/catch`
  unless you're translating an error into a different `AppError`.
- **Errors** — throw `AppError` subclasses; never `res.status(...).json({error})`
  inside services or controllers. Let `errorHandler` do that.
- **Logging** — use `logInfo` / `logError` from `utils/logger.js`. Avoid
  `console.log` outside `server.js`.
- **Env** — read only from `config/env.js`. Validate new required vars there.
- **Transactions** — when a service mutates more than one table, acquire a
  connection from the pool and use `connection.beginTransaction()`.

---

## 8. Migration notes (June 2026 reorganization)

This restructure introduced new folders and renamed one. Imports in existing
files still need updating:

| Old path                                         | New path                                |
| ------------------------------------------------ | --------------------------------------- |
| `require("../db/pool")`                          | `require("../../database/pool")`        |
| `backend/db/schema.mysql55.sql`                  | `backend/database/sql/schema.mysql55.sql` |
| `src/db/initDatabase.js`                         | `database/init.js`                      |
| `require("../auth")`                             | `require("../middleware/auth")`         |

A grep for `db/dataStore` across `src/` will reveal every import that still
needs updating.

The legacy file `src/auth.js` is kept as a deprecation shim and re-exports
`middleware/auth`. Remove it once no controllers reference it.

---

## 9. Future improvements

- Replace inline `safeParse` calls in controllers with `validate()` middleware.
- Promote `services/orderService.js` patterns to other resources (currently
  most controllers go straight to repositories).
- Add a `tests/` tree mirroring `src/` once the structure stabilizes.
- Consider TypeScript or JSDoc-based type checking for repository return shapes.
