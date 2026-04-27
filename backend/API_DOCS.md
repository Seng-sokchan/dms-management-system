# Order Management API (Express.js)

Base URL: `http://localhost:4000/api`

## Authentication
- `POST /auth/login`
  - body: `{ "username": "admin", "password": "admin123" }`
  - response: `{ token, user }`
- Use `Authorization: Bearer <token>` for protected endpoints.

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
- `GET /mobile/orders`
- `PATCH /mobile/orders/:id/status`

## Demo Users
- Admin: `admin/admin123`
- Owner: `owner/owner123`
- Logistics: `logistics/logistics123`
- Delivery: `delivery/delivery123`
- Customer: `customer/customer123`

## Database Model (v3, App-Aligned)
- Schema is defined in `backend/db/schema.mysql55.sql` (MySQL 5.5.8 compatible).
- Active tables used by current API: `users`, `producers`, `delivery_agents`, `orders`, `payments`.
- `orders` uses the same single-item structure as current frontend/backend contracts.
- `order_status_history` exists as optional audit table for future enhancement.
- Initialize DB with: `npm run db:init` (uses `.env` DB credentials).
