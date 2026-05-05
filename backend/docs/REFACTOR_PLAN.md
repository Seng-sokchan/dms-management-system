# Backend Refactor Plan

A staged plan to bring the entire backend in line with `CODING_STANDARDS.md`,
without breaking the live API. The `orders` module has already been
refactored end-to-end as the reference implementation — copy that pattern
when migrating other modules.

---

## Goals

1. Make the layered architecture **enforced**, not aspirational. Today a few
   files (`validate.js`, `asyncHandler.js`, `utils/response.js`,
   `errors/HttpErrors.js`) exist but aren't used. The plan wires them up
   everywhere.
2. Move all Zod schemas out of controllers into `validators/`.
3. Push business logic from controllers into services.
4. Standardize the response envelope.
5. Replace ad-hoc `res.status(4xx).json({message})` with typed `AppError`s.
6. Remove dead/legacy code (`src/auth.js` shim, renamed-on-import patterns).

Non-goals (deliberately out of scope for this pass):

- Switching to TypeScript.
- Switching to a feature/domain-modular structure (`src/modules/<feature>/`).
  We're keeping the layered tree as decided.
- Changing the database schema or stored procedures.

---

## Audit findings (the "why")

After reviewing every file in `src/`, these are the concrete issues:

| Theme | Where | Symptom |
|---|---|---|
| Inline Zod schemas | `controllers/*.js` (orderController, authController, customerController, paymentController, …) | `z.object({...}).safeParse(req.body)` redefined inside almost every handler. Validation logic duplicated and untestable. |
| `validators/` folder is dead | `validators/order.validator.js`, `validators/auth.validator.js` | Schemas exist but no route imports them. `validate()` middleware never runs. |
| Controllers contain domain logic | `orderController.createOrder` looks up customer/item/truck and derives unit price | Should be in `orderService.create()`. Controllers should be 5–10 lines. |
| Controllers don't use `asyncHandler` | Every controller | Some `try/catch`, some not. Inconsistent error propagation. |
| Inconsistent response shape | `res.json(data)` vs `{data, count}` (mobile) vs `{ok: true, id}` (delete) | Frontend has to know which endpoint returns which envelope. |
| `utils/response.js` unused | `success`, `created`, `paginated` exist but no controller calls them | Dead helpers. |
| `errors/HttpErrors.js` underused | `NotFoundError`, `BadRequestError` exist but controllers do `res.status(404).json({message})` | Typed errors don't propagate; can't switch on `error.code` on the client. |
| Renamed-on-import smell | `listOrders: listOrdersDb`, `createOrder: createOrderDb` everywhere in controllers | The fact you have to rename means the controller is doing the repository's job. |
| Stray legacy file | `src/auth.js` is a deprecated shim re-exporting from `middleware/auth.js` | Should be deleted once nothing imports it. |
| In-handler helper definitions | `orderController.getStatusNames` is defined alongside HTTP handlers | Belongs in the service or repository. |
| No ESLint/Prettier config | Repo root, backend root | `// eslint-disable-next-line` comments imply a config that doesn't exist. |
| Ad-hoc env validation | `server.js` checks only `JWT_SECRET` | Should validate the full required set on boot. |

---

## Target tree

The tree itself doesn't move much — most of the change is **inside** files.
Two changes only:

```
backend/
├── docs/
│   ├── CODING_STANDARDS.md            ← NEW
│   ├── REFACTOR_PLAN.md               ← NEW (this file)
│   ├── ARCHITECTURE.md                ← stays
│   └── API_DOCS.md                    ← move from backend/ root into docs/
├── db/
│   └── schema.mysql55.sql
├── logs/
├── .eslintrc.json                     ← NEW
├── .prettierrc                        ← NEW
├── .editorconfig                      ← NEW
├── .env.example
├── package.json                       ← add lint/format scripts
└── src/
    ├── app.js
    ├── server.js                      ← expand env validation
    ├── auth.js                        ← DELETE (legacy shim)
    ├── config/
    ├── constants/
    ├── db/
    ├── dtos/
    ├── errors/
    ├── middleware/
    ├── repositories/                  ← function names normalized
    ├── services/                      ← one file per domain (expand)
    ├── controllers/                   ← thinned out
    ├── validators/                    ← all schemas centralized here
    ├── routes/                        ← `validate(...)` added everywhere
    └── utils/
```

---

## Migration order

Migrate one module at a time. After each module, run the smoke tests in
`docs/API_DOCS.md` to catch breakage. Estimated effort assumes a single
focused day per item.

| # | Module | Files touched | Status |
|---|---|---|---|
| 0 | Foundations: lint config, plan & standards docs | `.eslintrc.json`, `.prettierrc`, `.editorconfig`, `package.json`, `docs/*.md` | ✅ Done |
| 1 | **Orders (reference)** — refactor end-to-end | `controllers/orderController.js`, `services/orderService.js`, `validators/order.validator.js`, `routes/orderRoutes.js`, `repositories/orders.js` | ✅ Done |
| 2 | Auth | `controllers/authController.js`, `services/authService.js` (new), `validators/auth.validator.js`, `routes/authRoutes.js` | ⬜ |
| 3 | Customers | `controllers/customerController.js`, `services/customerService.js` (new), `validators/customer.validator.js`, `routes/customerRoutes.js` | ⬜ |
| 4 | Items + Catalog | `controllers/{item,catalog}Controller.js`, `services/{item,catalog}Service.js` (new), validators, routes | ⬜ |
| 5 | Trucks + Delivery | as above | ⬜ |
| 6 | Producers | as above | ⬜ |
| 7 | Payments — biggest, do last | `controllers/paymentController.js` (419 lines), `services/paymentService.js`, validators, routes | ⬜ |
| 8 | User management + Role menus + Activity logs + Address | as above | ⬜ |
| 9 | Cleanup | delete `src/auth.js`, remove `// eslint-disable-next-line` for `console`, add lint to CI | ⬜ |

For each module the recipe is identical:

1. Create/expand `validators/<resource>.validator.js` — move every
   inline Zod schema out of the controller.
2. Create/expand `services/<resource>Service.js` — move every business
   check (lookups, transitions, derivations) out of the controller.
3. Rewrite the controller as a list of thin `asyncHandler` wrappers that
   call the service and return via `success`/`created`/`noContent`.
4. Wire `validate({ body, params, query })` into the route file.
5. Replace `res.status(4xx).json({message})` with `throw new
   <Type>Error(message)` from inside the service.

---

## Reference: the orders module diff

These are the exact changes made to `orders` so you can pattern-match on
the rest.

### Before

```js
// controllers/orderController.js (excerpt)
async function createOrder(req, res) {
  const schema = z.object({ customerId: z.string().min(1), /* ... */ });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid order payload" });

  const customer = await getCustomerById(parsed.data.customerId);
  if (!customer) return res.status(400).json({ message: "Customer not found" });
  // ... 15 more lines of orchestration ...
  const order = await createOrderDb({ /* ... */ });
  return res.status(201).json(order);
}
```

### After

```js
// validators/order.validator.js
const createOrderSchema = z.object({ customerId: idString, /* ... */ });

// services/orderService.js
async function create(payload, { user }) {
  const customer = await customerRepository.getById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");
  // ... business logic ...
  return orderRepository.create({ /* ... */ });
}

// controllers/orderController.js
exports.create = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body, { user: req.user });
  return created(res, order);
});

// routes/orderRoutes.js
router.post(
  "/orders",
  requireAuth,
  requireRoles("Admin", "Owner", "Customer"),
  validate({ body: createOrderSchema }),
  orderController.create,
);
```

The shape is the same for every endpoint in the system. Once you see it
once, the rest is mechanical.

---

## Risk and rollback

- The orders module refactor is wire-compatible. The HTTP contract
  (paths, methods, request bodies) is unchanged. The response body
  switches to the standard envelope `{ success, data }` — frontends that
  read raw fields (`response.id`) need to read `response.data.id` instead.
  This is the only breaking change per module.
- For each module migrated, ship a single PR and bump the API to
  `/api/v1` (already mounted in `app.js`). Keep `/api` mounted for the
  legacy clients during the transition.
- Smoke test after each module: hit the routes listed in
  `docs/API_DOCS.md` for that module via the admin frontend client and the
  Postman collection.

---

## Definition of done

The refactor is finished when:

- [ ] No file in `controllers/` imports `zod`. (`grep -r "require(\"zod\")" src/controllers`)
- [ ] No file in `controllers/` calls a repository directly. (`grep -r "repositories" src/controllers` returns nothing)
- [ ] Every route file uses `validate(...)` for any non-trivial body/params/query.
- [ ] Every controller handler is wrapped in `asyncHandler`.
- [ ] Every error response goes through the global `errorHandler` (no inline `res.status(4xx).json(...)`).
- [ ] `npm run lint` passes with zero warnings.
- [ ] `src/auth.js` is deleted.
- [ ] `docs/CODING_STANDARDS.md` has been read by everyone touching the backend.
