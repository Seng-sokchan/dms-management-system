# Order Management API (Express.js)

Base URL: `http://localhost:4000/v1` (production: `https://api.dmscambodia.com/v1`)

## Authentication
- `POST /auth/login`
  - body: `{ "username": "<username>", "password": "<password>" }`
  - response: `{ token, user }`
- Use `Authorization: Bearer <token>` for protected endpoints.
- `GET /users/me` includes `customerId` for **Customer** accounts and `deliveryAgentId` for **Delivery** accounts (nullable). Delivery users must be linked to a `delivery_agents` row (via Admin **Users**) so mobile and sockets can resolve the agent.

## Main Endpoints
- `GET /health`
- `GET /users/me`
- `GET/POST /producers`
- `GET/POST /delivery-agents`
- `GET/POST /orders`
- `PATCH /orders/:id` (assign producer/delivery agent)
- `PATCH /orders/:id/status`
- `POST /orders/:id/delivery-confirmation`
  - body: `{ "lossQty": 2 }` — `deliveredQty` is computed as `orderedQty - lossQty`
  - validation: `0 <= lossQty <= orderedQty`; order must be `Ready_For_Delivery`
  - roles: Admin, Delivery (Delivery must own the assigned order)
- `POST /payments/intents` — start PayWay checkout for one order (body: `{ orderId }`; session stored in Redis; uses PayWay `checkout2-0.js` flow)
- `POST /payments/batch-intents` — start PayWay checkout for a depot batch (body: `{ batchId }`; Redis session)
- `GET /payments/:paymentId/checkout-page` — PayWay checkout HTML for mobile WebView (`?token=` JWT query param for WebView auth)
- `POST /payments/:paymentId/live-check/start` — start Redis-only KHQR status polling (checkout open)
- `POST /payments/:paymentId/live-check/stop` — stop Redis polling when user closes checkout
- `GET /payments/:paymentId` — poll payment status (`liveCheckActive` in response; PayWay reconcile only while Redis live-check is active)
- `GET /orders/:orderId/payment` — latest payment for an order
- `POST /payments/:paymentId/cancel` — cancel pending checkout session (Redis)
- `POST /webhooks/payway` — PayWay server callback (no auth; configure as PayWay `callback_url`)
- `PAYWAY_RETURN_DEEPLINK_BASE` — e.g. `dms://payment/result/success` (ABA Mobile opens this after pay; mobile app shows transaction completed UI)
- PayWay checkout sessions are stored in **Redis only** (`payment:watch:*`, `payment:tran:*`, `payment:pending`); completed payments are persisted in `payments`. `REDIS_URL` is required to start checkout. Live KHQR polling runs every 5 seconds while checkout is open.
- `GET /dashboard/summary`

## Mobile Integration Endpoints
- `GET /mobile/orders` — **Customer** sees orders for their linked customer; **Delivery** sees only orders whose `delivery_agent_id` matches `users.delivery_agent_id` for that login (empty list if the user is not linked to an agent).
- `GET /mobile/orders/:id/delivery-location` — latest driver GPS for an order in **Ready_For_Delivery** (Customer: own order; Depot: depot customers; Delivery: assigned agent; Admin/Owner/Logistics: any). Response: `{ deliveryAgentId, lastKnown }`.
- `POST /mobile/orders/:id/status`
- `POST /mobile/orders/:id/delivery-confirmation` — same body/rules as web delivery confirmation (for Delivery drivers completing a stop)

## Database Model (v3, App-Aligned)
- Schema is defined in `backend/database/sql/schema.mysql55.sql` (MySQL 5.5.8 compatible).
- Active tables used by current API: `users`, `producers`, `delivery_agents`, `orders`, `payments`.
- `users.delivery_agent_id` (nullable, unique when set) links a **Delivery** login to `delivery_agents.id`; order assignment still uses `orders.delivery_agent_id`.
- `orders` uses the same single-item structure as current frontend/backend contracts.
- `order_status_history` exists as optional audit table for future enhancement.
- `delivery_agent_locations` stores the latest GPS per `delivery_agent_id` (upsert, throttled writes) while drivers emit `delivery:location` over Socket.IO.
- Initialize DB with: `npm run db:init` (uses `.env` DB credentials).
