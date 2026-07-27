const UNPAID_PAYMENT = new Set(["unpaid", "pending"]);

const RECEIVED_STATUS = "Recieve_By_Customer";

export const UNPAID_RECEIVED_LIMIT = 1;

export function listUnpaidReceivedOrders(orders) {
  return (orders || []).filter(
    (order) =>
      order?.status === RECEIVED_STATUS
      && !order?.isSpecialDay
      && UNPAID_PAYMENT.has(String(order?.paymentStatus || "unpaid").toLowerCase()),
  );
}

export function countUnpaidReceivedOrders(orders) {
  return listUnpaidReceivedOrders(orders).length;
}

export function findUnpaidReceivedOrder(orders, limit = UNPAID_RECEIVED_LIMIT) {
  const unpaid = listUnpaidReceivedOrders(orders);
  const max = Number(limit) > 0 ? Number(limit) : UNPAID_RECEIVED_LIMIT;
  if (unpaid.length < max) return null;
  return unpaid[0] || null;
}

export function canPlaceNewOrder(orders, limit = UNPAID_RECEIVED_LIMIT) {
  const max = Number(limit) > 0 ? Number(limit) : UNPAID_RECEIVED_LIMIT;
  return countUnpaidReceivedOrders(orders) < max;
}
