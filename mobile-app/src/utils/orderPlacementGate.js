const UNPAID_PAYMENT = new Set(["unpaid"]);

const RECEIVED_STATUS = "Recieve_By_Customer";

export function findUnpaidReceivedOrder(orders) {
  return (
    (orders || []).find(
      (order) =>
        order?.status === RECEIVED_STATUS
        && UNPAID_PAYMENT.has(order?.paymentStatus || "unpaid"),
    ) || null
  );
}

export function canPlaceNewOrder(orders) {
  return !findUnpaidReceivedOrder(orders);
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
