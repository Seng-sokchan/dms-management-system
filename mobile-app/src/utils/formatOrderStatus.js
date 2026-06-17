/**
 * Maps backend order status enums to i18n keys under orderStatus.*
 */
const STATUS_KEYS = {
  Sent_To_Factory: "orderStatus.sentToFactory",
  Ready_For_Delivery: "orderStatus.readyForDelivery",
  Recieve_By_Customer: "orderStatus.receivedByCustomer",
  Delivered: "orderStatus.delivered",
  Cancelled: "orderStatus.cancelled",
};

export function formatOrderStatus(status, t) {
  if (!status) return t("common.dash");
  const key = STATUS_KEYS[status];
  return key ? t(key) : status;
}
