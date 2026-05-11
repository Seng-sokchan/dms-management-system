# Backend Coding Standards

These are the binding style and architecture rules for the DMS backend. New
code must follow them. Existing code is being migrated incrementally, with the
`orders` module as the reference implementation (see `REFACTOR_PLAN.md`).

The goal: a thin, predictable layered architecture where each file has one job
and any new feature is added by following the same five-step pattern every
time.

---

## 1. Layered architecture

Strict, one-way flow:

```
HTTP request
   |
   v
routes/  ----- (auth + validate middleware)
   |
   v
controllers/  ---- parse req, call service, format response
   |
   v
services/     ---- domain rules, orchestration, transactions
   |
   v
repositories/ ---- SQL / stored procedures only
   |
   v
   DB
```

Rules:

- A **route** never calls a service or repository directly.
- A **controller** never calls a repository directly. It calls a service.
- A **service** never touches `req` / `res`. It receives plain arguments and
  returns plain values or throws `AppError`.
- A **repository** never imports another repository for business logic — it is
  pure data access. Cross-table reads belong in services.
- Controllers, services, and repositories are not allowed to `console.log` —
  use `utils/logger.js`.

A new feature is always added in this order: repository → service →
validator → controller → route. Anything skipped is a smell.

---

## 2. File and folder layout

```
backend/
├── docs/
│   ├── CODING_STANDARDS.md   ← this file
│   ├── REFACTOR_PLAN.md
│   ├── ARCHITECTURE.md
│   └── API_DOCS.md
├── db/
│   └── schema.mysql55.sql
├── logs/
└── src/
    ├── app.js                ← Express app wiring only
    ├── server.js             ← bootstrapping (env, db check, listen)
    ├── config/               ← db pool, env loading, constants from env
    ├── constants/            ← static enums, role menus
    ├── db/                   ← migrations, init scripts, low-level pool
    ├── dtos/                 ← shape transforms for HTTP boundaries
    ├── errors/               ← AppError, HttpErrors, asyncHandler
    ├── middleware/           ← cross-cutting Express middleware
    ├── repositories/         ← one file per aggregate, exports plain functions
    ├── services/             ← one file per domain, business logic
    ├── controllers/          ← one file per resource, thin
    ├── validators/           ← one file per resource, Zod schemas only
    ├── routes/               ← one file per resource, mounting + middleware
    └── utils/                ← framework-agnostic helpers
```

File-naming rules:

- Lowercase resource name, full role suffix: `orderController.js`,
  `orderRoutes.js`, `order.validator.js`. Plural in repositories
  (`orders.js`) because they expose collection-level functions.
- Stored procedure names stay `sp_<verb>_<noun>(...)` and live in `db/`.

---

## 3. Routes

A route file is a flat list of `router.<verb>(path, ...middleware, handler)`
calls. Nothing else.

```js
// src/routes/orderRoutes.js
const express = require("express");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
} = require("../validators/order.validator");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get(
  "/orders",
  requireAuth,
  validate({ query: listOrdersQuerySchema }),
  orderController.list,
);

router.post(
  "/orders",
  requireAuth,
  requireRoles("Admin", "Owner", "Customer"),
  validate({ body: createOrderSchema }),
  orderController.create,
);

router.post(
  "/orders/:id/status",
  requireAuth,
  requireRoles("Admin", "Owner", "Logistics", "Delivery"),
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);

module.exports = router;
```

Rules:

- Order in every line: `requireAuth → requireRoles → validate → handler`.
- Mount more specific paths before less specific ones (`/orders/:id/status`
  before `/orders/:id`).
- Never inline a regex, schema, or business check in a route file.

---

## 4. Controllers

Controllers do four things and nothing else:

1. Pull validated data from `req` (already parsed by `validate()`).
2. Pull caller identity from `req.user`.
3. Call a service.
4. Format the response with `success` / `created` / `noContent`.

```js
// src/controllers/orderController.js
const orderService = require("../services/orderService");
const { success, created } = require("../utils/response");
const { asyncHandler } = require("../errors");

exports.list = asyncHandler(async (req, res) => {
  const orders = await orderService.list({ user: req.user, query: req.query });
  return success(res, orders);
});

exports.create = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body, { user: req.user });
  return created(res, order);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(
    req.params.id,
    req.body.status,
    { user: req.user },
  );
  return success(res, order);
});
```

Rules:

- Wrap every async handler in `asyncHandler(...)`.
- Never `try/catch` in a controller. Throw `AppError` from the service; the
  global error handler turns it into a 4xx/5xx.
- Never construct response payloads ad-hoc. Use `success`, `created`,
  `noContent`, `paginated` from `utils/response.js`.
- Never call `res.status(400).json(...)` for validation; that's the
  validator's job.
- No `safeParse` in controllers — ever. If it's there, the file is wrong.

---

## 5. Services

Services hold the domain logic. They know nothing about Express.

```js
// src/services/orderService.js
const orderRepository = require("../repositories/orders");
const customerRepository = require("../repositories/customers");
const itemRepository = require("../repositories/items");
const deliveryAgentRepository = require("../repositories/deliveryAgents");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../errors");

async function list({ user, query }) {
  const orders = await orderRepository.list(query);
  if (user?.role !== "Customer") return orders;

  const customer = await customerRepository.getByUserId(user.sub);
  if (!customer) return [];
  return orders.filter((o) => String(o.customerId) === String(customer.id));
}

async function create(payload, { user }) {
  const customer = await customerRepository.getById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");

  const item = await itemRepository.getById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");

  if (payload.deliveryAgentId) {
    const agent = await deliveryAgentRepository.getDeliveryAgentById(payload.deliveryAgentId);
    if (!agent) throw new BadRequestError("Delivery agent not found");
  }

  return orderRepository.create({
    ...payload,
    addressId: customer.address,
    unitPrice: payload.unitPrice ?? item.defaultUnitPriceUsd,
    producerId: payload.producerId ?? null,
    deliveryAgentId: payload.deliveryAgentId ?? null,
  });
}

module.exports = { list, create /* ... */ };
```

Rules:

- All inputs already validated. Trust the shape, defend against semantic
  errors only (e.g. "customer not found", "status transition illegal").
- Throw typed errors: `NotFoundError`, `BadRequestError`, `ForbiddenError`,
  `ConflictError`, `ValidationError`. Never a bare `Error`.
- For multi-step writes, use `orderRepository.transaction(async (tx) => {…})`
  rather than chaining queries on a shared pool.
- No HTTP terms (`req`, `res`, `status code`, `bearer`) appear in a service.

---

## 6. Repositories

One file per aggregate. Each function does one query and returns mapped
domain objects (via `mappers.js`), never raw MySQL rows.

```js
// src/repositories/orders.js
const { getPool } = require("../db/pool");
const { mapOrder } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

async function list() {
  const [rows] = await getPool().query("CALL sp_list_orders()");
  return unwrapProcedureRows(rows).map(mapOrder);
}

async function getById(id) {
  const [rows] = await getPool().query("CALL sp_get_order_by_id(?)", [id]);
  const result = unwrapProcedureRows(rows);
  return result[0] ? mapOrder(result[0]) : null;
}

module.exports = { list, getById /* ... */ };
```

Rules:

- Use parameterized queries / stored procedures only. Never string
  concatenation.
- Repositories may import other repositories *only* for trivial lookups
  (e.g., resolving a status ID by name). Anything semantic belongs in the
  service.
- Always export plain functions named in verb form: `list`, `getById`,
  `create`, `update`, `remove`. Avoid `getOrders`, `findOrders`,
  `fetchOrders` — pick one and stick with it (`list` / `getById`).
- Repositories never throw `AppError` — they throw raw DB errors. Services
  translate.

---

## 7. Validators

Zod schemas live in `validators/<resource>.validator.js`. The route uses
`validate({ body, params, query })`. The controller never sees Zod.

```js
// src/validators/order.validator.js
const { z } = require("zod");
const { ORDER_STATUS } = require("../constants/general");

const idString = z.string().min(1);

const createOrderSchema = z.object({
  customerId: idString,
  itemId: idString,
  orderedQty: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  producerId: idString.nullable().optional(),
  deliveryAgentId: idString.nullable().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
});

const orderIdParamsSchema = z.object({ id: idString });

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(ORDER_STATUS).optional(),
  customerId: idString.optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
};
```

Rules:

- Reuse small schemas. Don't redefine `idString` ten times.
- Coerce query params (`z.coerce.number()`) — Express gives strings.
- For enum-like fields, import from `constants/` and use `z.enum(...)` so the
  validator and the database stay in sync.
- Never put a validator in a controller. Ever.

---

## 8. Errors

- Throw `AppError` subclasses; never `throw new Error("...")`.
- Available subclasses: `BadRequestError` (400), `UnauthorizedError` (401),
  `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409),
  `ValidationError` (422), `TooManyRequestsError` (429).
- The global `errorHandler` middleware translates `AppError` to:

  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Order not found",
      "details": null
    }
  }
  ```

  Non-`AppError` failures become `500 INTERNAL_ERROR` with the message
  redacted in production.

---

## 9. Response envelope

Every successful response uses one of:

```js
success(res, data);                            // 200
created(res, data);                             // 201
noContent(res);                                 // 204
paginated(res, items, { page, pageSize, total });
```

Resulting body:

```json
{ "success": true, "data": <payload>, "meta"?: { ... } }
```

Failure body (set by `errorHandler`):

```json
{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }
```

Migration note: the old shape `res.json(data)` is acceptable on legacy
endpoints until they're refactored, but new endpoints must use the envelope.

---

## 10. JavaScript style

- `async/await` only. No `.then()` chains. No callbacks.
- `const` by default. `let` only when the variable is reassigned.
- Destructure imports at the top:

  ```js
  const { success, created } = require("../utils/response");
  ```

  Avoid renaming on import (`createOrder: createOrderDb`) — it's a smell that
  means the layer boundary was wrong.
- 2-space indentation, double quotes, trailing commas (matches Prettier
  config in repo root).
- Filenames: `camelCase.js` for code, `kebab-case.md` only for docs is fine
  but match what's already in the repo (`API_DOCS.md`, etc.).
- No default exports in repositories/services/controllers — always
  `module.exports = { ... }` so the public surface is explicit.
- Use `??` instead of `||` for nullable defaults (`unitPrice ?? item.default`,
  not `unitPrice || item.default` — the latter swallows `0`).

---

## 11. Security defaults

- All public endpoints behind `apiRateLimit`.
- Mutating endpoints behind `requireAuth` + `requireRoles(...)`.
- All user input validated by a Zod schema.
- All queries parameterized.
- Secrets only via `process.env.*`. The startup hook in `server.js` checks
  `JWT_SECRET` is present; add new required vars there too.
- Tokens: 12h access, refresh tokens to be added (`refreshTokens` table is
  on the roadmap).
- CORS origin is a comma-separated allowlist in `ALLOWED_ORIGINS`. No `*`
  in production.

---

## 12. Logging

- Use `utils/logger.js` (`logInfo`, `logError`).
- Structured logs only (objects, not concatenated strings).
- The error handler already logs every failure; don't double-log inside
  services.

---

## 13. Testing

- Co-locate Node's built-in test runner files as `<file>.test.js`.
- Service tests are mandatory for any non-trivial business rule. Repository
  tests can be skipped if the SP is the contract.
- `npm test` runs `node --test`.

---

## 14. The five-step recipe (memorize this)

When adding a new endpoint:

1. **Repository** — write the SQL/SP and a function in
   `repositories/<aggregate>.js` that returns mapped objects.
2. **Service** — add a function in `services/<domain>Service.js` that uses
   the repository and enforces business rules. Throws typed errors.
3. **Validator** — add Zod schemas in `validators/<resource>.validator.js`.
4. **Controller** — thin handler in `controllers/<resource>Controller.js`
   wrapped in `asyncHandler`, returning via `success`/`created`.
5. **Route** — wire it in `routes/<resource>Routes.js` with
   `requireAuth → requireRoles → validate → controller`.

If you skipped a step, you broke the architecture. Go back.
