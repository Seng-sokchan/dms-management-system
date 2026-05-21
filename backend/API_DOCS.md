# Order Management API (Express.js)

Base URL: `http://localhost:4000/v1` (production: `https://api.dmscambodia.com/v1`)

## Authentication
- `POST /auth/login`
  - body: `{ "username": "admin", "password": "admin123" }`
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
  - body: `{ "deliveredQty": 100, "lossQty": 2, "remainingQty": 3 }`
  - validation: delivered + loss + remaining must be <= orderedQty
- `GET/POST /payments`
- `GET /dashboard/summary`

## Mobile Integration Endpoints
- `GET /mobile/orders` — **Customer** sees orders for their linked customer; **Delivery** sees only orders whose `delivery_agent_id` matches `users.delivery_agent_id` for that login (empty list if the user is not linked to an agent).
- `POST /mobile/orders/:id/status`

## Demo Users
- Admin: `admin/admin123`
- Owner: `owner/owner123`
- Logistics: `logistics/logistics123`
- Delivery: `delivery/delivery123`
- Customer: `customer/customer123`

## Database Model (v3, App-Aligned)
- Schema is defined in `backend/db/schema.mysql55.sql` (MySQL 5.5.8 compatible).
- Active tables used by current API: `users`, `producers`, `delivery_agents`, `orders`, `payments`.
- `users.delivery_agent_id` (nullable, unique when set) links a **Delivery** login to `delivery_agents.id`; order assignment still uses `orders.delivery_agent_id`.
- `orders` uses the same single-item structure as current frontend/backend contracts.
- `order_status_history` exists as optional audit table for future enhancement.
- Initialize DB with: `npm run db:init` (uses `.env` DB credentials).
