# Order Management Admin Panel

Fullstack implementation based on the attached
- Frontend: React.js (`frontend`)
- Backend: Express.js (`backend`)
- Database design: MySQL 5.5.8 schema (`backend/db/schema.mysql55.sql`)

## Features Implemented
- Authentication and role permission (Admin, Owner, Logistics, Delivery, Customer)
- Role-based menu access configuration (Admin can customize which menus each role can access)
- Catalog + item management (`catalogs` first, then `items`)
- Order create/workflow status transitions
- Producer management
- Delivery agent management
- Delivery quantity confirmation + discrepancy tracking
- Delivery loss/remaining tracking with quantity validation
- Payment recording (partial/full) + payment status updates
- Overview summary/report totals
- Mobile API integration endpoints
- Bilingual UI (English/Khmer) with persisted language choice
- Responsive UI improvements for tablet/mobile and modernized list/table styling

## Project Structure
- `backend/src/server.js`: process entrypoint (starts HTTP server)
- `backend/src/app.js`: app bootstrap (middleware + route mounting)
- `backend/src/config/*`: environment configuration
- `backend/src/middleware/*`: auth + HTTP middlewares
- `backend/src/routes/*`: route modules per domain
- `backend/src/controllers/*`: request handlers
- `backend/src/services/*`: shared business/domain logic
- `backend/db/schema.mysql55.sql`: relational schema (MySQL 5.5.8)
- `ORDER_PROCESS.md`: business workflow from order creation to payment
- `backend/API_DOCS.md`: endpoint documentation
- `frontend/src/components/*`: reusable UI components
- `frontend/src/pages/*`: page-level composition
- `frontend/src/hooks/*`: stateful dashboard logic
- `frontend/src/services/*`: HTTP/API layer
- `frontend/src/App.jsx`: top-level app orchestration

## Run Locally
1. Backend
   - `cd backend`
   - copy `.env.example` to `.env`
   - update DB credentials in `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
   - `npm install`
   - `npm run db:init` — reapplies `schema.mysql55.sql`, **clears** app data, seeds roles/menus, and creates one login per role (`admin`, `owner`, `logistics`, `delivery`, `customer`, `depot`; password `admin123`, override with `DB_INIT_SEED_PASSWORD`)
   - `npm run dev`
2. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Open frontend URL from Vite output.

## Frontend Routes
- `/overview`
- `/catalogs`
- `/items`
- `/customers`
- `/producers`
- `/delivery-agents`
- `/orders`
- `/confirm-orders`
- `/payments`
- `/users` (Admin/Owner)
- Redirects: `/` -> `/overview`

## Functional Test Checklist (UAT)
- Login with Admin or Owner account for the admin panel.
- Create catalog(s), then add item(s) under catalogs.
- Create customer, producer, and delivery agent.
- Orders are created from the mobile app (Customer); manage them in the admin Orders pages.
- Move status step-by-step from `NEW_ORDER` to `RECEIVED_BY_CUSTOMER`.
- In Confirm Orders, move `SENT_TO_LOGISTICS_SUPPLIER` -> `OUT_FOR_DELIVERY` directly.
- Confirm delivered quantity and validate discrepancy result.
- Record partial payment and verify `UNPAID` remains until full amount.
- Record remaining payment and verify `PAID` status.
- Confirm overview totals (revenue, collected, outstanding).
- Call mobile endpoints with bearer token and verify response format.

## Deployment Handover Notes
- Set secure `JWT_SECRET` in production.
- Use MySQL 5.5.8 and apply `backend/db/schema.mysql55.sql` through your migration flow.

## Database Design Notes (App-Aligned)
- Schema is redesigned to match current frontend/backend payloads exactly.
- Schema is compatible with MySQL `5.5.8`.
- Main tables currently used by APIs: `users`, `producers`, `delivery_agents`, `catalogs`, `items`, `orders`, `payments`.
- Role/menu access tables: `roles`, `role_menus`.
- `items` belong to a `catalogs` row (`catalog_id` required). Create a catalog before adding items.
- `orders` link to `items` via `item_id` (required); display name comes from the `items` row (joined with `items` / `catalogs` as needed), not a duplicate column on `orders`.
- IDs are numeric (`INT UNSIGNED` for main entities).
- Foreign keys and indexes are still included for maintainability and performance.
- API responses use camelCase; DB columns are snake_case; list endpoints **join** related tables (e.g. order rows include producer/agent names, payments include order customer/item labels).
- Profile endpoint `/v1/users/me` returns `{ id, name, username, role, allowedMenus }`.
