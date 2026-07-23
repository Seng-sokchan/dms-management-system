# Order Process (Start to End)

This document reflects the **current implementation** from order creation through payment and delivery completion.

## Overview

- Workflow unit: `order_details` (line items under an `orders` header / batch)
- Status lookup: `status` table
- Payment status: `UNPAID` / `PAID` (independent of delivery status)
- Key roles:
  - `Owner` / `Admin`: create and manage orders, assign producer / delivery agent
  - `Delivery`: start delivery (→ `Ready_For_Delivery`), confirm receipt with loss qty
  - `Customer` / `Depot`: track live GPS while `Ready_For_Delivery`
  - `Owner` / `Admin`: record payments

## Status lifecycle

```
Owner_Preparing → Sent_To_Factory → Ready_For_Delivery → Recieve_By_Customer
```

| Status | Meaning |
|--------|---------|
| `Owner_Preparing` | Order created; owner prepares and can assign producer / delivery agent |
| `Sent_To_Factory` | Sent to factory / producer (Telegram notify may fire) |
| `Ready_For_Delivery` | Out for delivery; **live GPS tracking is available** |
| `Recieve_By_Customer` | Delivery confirmed (spelling preserved in DB/code); Telegram notify may fire |

Payment does **not** drive these transitions.

## Step-by-step flow

### Step 1 — Order created

- Create order from admin UI or API (`POST /v1/orders`)
- Initial status: `Owner_Preparing`
- Initial payment status: `UNPAID`
- Placement gate: a customer cannot place a new order while they already have unpaid `Recieve_By_Customer` order(s) at or above the current limit
  - Normal: max **1** unpaid received order
  - Special day (Admin/Owner toggle): max **2** unpaid received orders
  - Flag: `app_settings.special_day_enabled` via `GET/PUT /v1/app-settings/special-day`

### Step 2 — Owner prepares and assigns

- Assign `producer_id` and/or `delivery_agent_id` as needed
- Status remains `Owner_Preparing` until explicitly moved
- Typical API: `POST /v1/orders/:id` (assignment) / status move endpoints

### Step 3 — Sent to factory

- Status → `Sent_To_Factory`
- Factory / Telegram notification may be sent for the batch

### Step 4 — Start delivery (out for delivery)

- Delivery app batches `Sent_To_Factory` orders and starts delivery
- Status → `Ready_For_Delivery`
- Driver GPS is published over Socket.IO (`delivery:location`)
- Latest point stored in `delivery_agent_locations` (throttled); optional Redis cache when `REDIS_URL` is set
- Customer / Depot / Admin watchers can subscribe for live updates

### Step 5 — Confirm delivery

- Driver (or Admin) confirms with **loss quantity** only
- `deliveredQty = orderedQty - lossQty`
- Status → `Recieve_By_Customer`
- Typical API: `POST /v1/orders/:id/delivery-confirmation` with `{ lossQty }`
- Mobile: `POST /v1/mobile/orders/:id/delivery-confirmation`
- Telegram group alert may be sent (soft-fail: delivery still succeeds if Telegram is down)

There is **no** delivery proof type (PHOTO / SIGNATURE / OTP) in the current codebase.

### Step 6 — Payment (can happen later)

- Record payments via `POST /v1/payments`
- Aggregates update `amount_paid` and `payment_status` (`UNPAID` / `PAID`)
- Payment does not force a delivery status change

## Live tracking

| Audience | Mechanism |
|----------|-----------|
| Delivery driver | Emits GPS while active `Ready_For_Delivery` orders exist |
| Customer | `subscribe:customer-order-tracking` + REST fallback `GET /v1/mobile/orders/:id/delivery-location` |
| Depot / Admin / Owner / Logistics | `subscribe:delivery-locations` watcher room |

Tracking is available **only** at `Ready_For_Delivery` with a delivery agent assigned.

## Status summary

### Order status (`status` table)

1. `Owner_Preparing`
2. `Sent_To_Factory`
3. `Ready_For_Delivery`
4. `Recieve_By_Customer`

### Payment status

1. `UNPAID`
2. `PAID`

## Related tables

- `orders` — batch / order header (`order_no`, `target_type`)
- `order_details` — line workflow (customer, item, qty, status, agent, delivered/loss)
- `status` — order status lookup
- `delivery_agents` — agent master data
- `delivery_agent_locations` — latest GPS per agent
- `payments` — payment transactions
- `app_settings` — system flags (e.g. `special_day_enabled`)

## Notes

- API status codes: `200` / `201` success; `400` validation; `401` unauthorized; `403` forbidden; `500` server error
- Redis is **optional** for last-known location cache; Socket.IO + MySQL work without it
