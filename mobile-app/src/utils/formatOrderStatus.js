/**
 * Maps backend order status enums to i18n keys under orderStatus.*
 * Display labels correct the Recieve_By_Customer spelling for UI only.
 */
const STATUS_KEYS = {
  Owner_Preparing: "orderStatus.ownerPreparing",
  Sent_To_Factory: "orderStatus.sentToFactory",
  Ready_For_Delivery: "orderStatus.readyForDelivery",
  Recieve_By_Customer: "orderStatus.receivedByCustomer",
  Delivered: "orderStatus.delivered",
  Cancelled: "orderStatus.cancelled",
};

const STATUS_SHORT_KEYS = {
  Owner_Preparing: "orderStatusShort.ownerPreparing",
  Sent_To_Factory: "orderStatusShort.sentToFactory",
  Ready_For_Delivery: "orderStatusShort.readyForDelivery",
  Recieve_By_Customer: "orderStatusShort.receivedByCustomer",
  Delivered: "orderStatusShort.delivered",
  Cancelled: "orderStatusShort.cancelled",
};

export function formatOrderStatus(status, t) {
  if (!status) return t("common.dash");
  const key = STATUS_KEYS[status];
  return key ? t(key) : status;
}

export function formatOrderStatusShort(status, t) {
  if (!status) return t("common.dash");
  const shortKey = STATUS_SHORT_KEYS[status];
  if (shortKey) return t(shortKey);
  return formatOrderStatus(status, t);
}
