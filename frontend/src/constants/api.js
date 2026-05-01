/**
 * Shared API constants — order statuses, payment statuses, and roles.
 * Source of truth for both frontend logic and UI labels.
 */

export const ORDER_STATUS = [
  "NEW_ORDER",
  "OWNER_PREPARING",
  "SENT_TO_LOGISTICS_SUPPLIER",
  "OUT_FOR_DELIVERY",
  "RECEIVED_BY_CUSTOMER",
];

export const PAYMENT_STATUS = ["UNPAID", "PAID"];

export const ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer"];
