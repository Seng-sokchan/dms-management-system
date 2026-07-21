const UNPAID_PAYMENT = new Set(["unpaid", "pending"]);

const RECEIVED_STATUS = "Recieve_By_Customer";

const DEFAULT_UNPAID_RECEIVED_LIMIT = 1;

export function listUnpaidReceivedOrders(orders) {
  return (orders || []).filter(
    (order) =>
      order?.status === RECEIVED_STATUS
      && UNPAID_PAYMENT.has(String(order?.paymentStatus || "unpaid").toLowerCase()),
  );
}

export function countUnpaidReceivedOrders(orders) {
  return listUnpaidReceivedOrders(orders).length;
}

export function normalizeUnpaidReceivedLimit(limit) {
  const n = Number(limit);
  if (n === 2) return 2;
  return DEFAULT_UNPAID_RECEIVED_LIMIT;
}

/**
 * Returns one unpaid received order to highlight in the UI when placement is blocked.
 * Prefer the oldest/first match when over the allowed limit.
 */
export function findUnpaidReceivedOrder(orders, limit = DEFAULT_UNPAID_RECEIVED_LIMIT) {
  const unpaid = listUnpaidReceivedOrders(orders);
  const max = normalizeUnpaidReceivedLimit(limit);
  if (unpaid.length < max) return null;
  return unpaid[0] || null;
}

export function canPlaceNewOrder(orders, limit = DEFAULT_UNPAID_RECEIVED_LIMIT) {
  return countUnpaidReceivedOrders(orders) < normalizeUnpaidReceivedLimit(limit);
}

export function getCustomerRootNavigation(navigation) {
  let current = navigation;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const routeNames = current.getState?.()?.routeNames;
    if (Array.isArray(routeNames) && routeNames.includes("OrderPayment")) {
      return current;
    }
    current = current.getParent?.();
  }
  return navigation?.getParent?.()?.getParent?.() || navigation?.getParent?.() || navigation;
}

export function navigateToOrderPayment(navigation, order) {
  const rootNav = getCustomerRootNavigation(navigation);
  rootNav?.navigate?.("OrderPayment", { order });
}
