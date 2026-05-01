# Order Process (Start to End)

This document reflects the current implementation from order creation through payment and delivery completion.

## Overview

- Core object: `orders`
- Status lookup table: `status`
- Payment status lookup table: `payment_statuses`
- Key roles involved:
  - `Owner` / `Admin`: create and manage orders
  - `Logistics` / `Delivery`: works in Confirm Orders and delivery confirmation flows
  - `Owner` / `Admin`: payment recording

## Step-by-Step Flow

### Step 1 - Order Created

- Action: create order from UI (`/create-order`) or API
- Initial values:
  - `status = NEW_ORDER`
  - `payment_status = UNPAID`
  - delivery proof fields are empty

Typical API:
- `POST /api/orders`

---

### Step 2 - Owner Prepares and Assigns Truck

- Action: owner prepares the order and assigns truck/producer information
- Data saved:
  - `producer_id`
  - `truck_id` (when known)
- Status after assign:
  - `OWNER_PREPARING`

Typical API:
- `PATCH /api/orders/:id`

---

### Step 3 - Send to Logistics Supplier

- Trigger: owner passes step 2 information to logistics supplier.
- Result:
  - status becomes `SENT_TO_LOGISTICS_SUPPLIER`

---

### Step 4 - Send Out For Delivery

- Action: logistics confirms handover and starts truck delivery.
- Status moves to:
  - `OUT_FOR_DELIVERY`

Typical API:
- `PATCH /api/orders/:id`

---

### Step 5 - Truck Delivers to Customer

- Action: truck reaches customer and final delivery confirmation is prepared.

---

### Step 6 - Customer Confirms Receipt

- Action: confirm actual delivered quantities
- Required data:
  - `deliveredQty`
  - `lossQty`
  - `remainingQty`
  - `deliveryProofType` (`PHOTO` / `SIGNATURE` / `OTP`)
  - `deliveryProofValue` (proof reference/value)
- Validation:
  - `deliveredQty + lossQty + remainingQty <= orderedQty`
- Status moves to:
  - `RECEIVED_BY_CUSTOMER`

Typical API:
- `POST /api/orders/:id/delivery-confirmation`

---

### Step 7 - Payment (Can Happen Later)

- Action: record payment entries
- Payment records are stored in `payments`
- Order aggregates update:
  - `amount_paid`
  - `payment_status` (`UNPAID` / `PAID`)
- If fully paid:
  - `payment_status = PAID`
- Payment no longer forces status transition, so customer can pay later.

Typical API:
- `POST /api/payments`

## Status Summary

### Order status (`status` table)

1. `NEW_ORDER`
2. `OWNER_PREPARING`
3. `SENT_TO_LOGISTICS_SUPPLIER`
4. `OUT_FOR_DELIVERY`
5. `RECEIVED_BY_CUSTOMER`

### Payment status (`payment_statuses` table)

1. `UNPAID`
2. `PAID`

## Related Tables

- `orders`: main transaction
- `status`: order status lookup
- `payment_statuses`: payment status lookup
- `payments`: payment transactions
- `order_status_history`: status audit history

## Notes

- API uses standard status behavior in controllers/middleware:
  - success: `200` / `201` (depending on endpoint)
  - validation/client error: `400`
  - unauthorized: `401`
  - forbidden: `403`
  - internal error: `500`
- User actions are tracked by activity logging and visible in admin `User Activity Log`.
