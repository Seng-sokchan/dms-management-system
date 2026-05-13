/**
 * Shared API constants — order statuses and roles.
 * Source of truth for both frontend logic and UI labels.
 */

export const ORDER_STATUS = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

export const ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];
