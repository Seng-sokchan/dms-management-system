import { InteractionManager } from "react-native";
import { createNavigationContainerRef, CommonActions } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

const PAYMENT_ROOTS = new Set(["Main", "DepotMain"]);

function rootForRole(role) {
  if (role === "Depot") return "DepotMain";
  return "Main";
}

function getFocusedRouteName(state) {
  if (!state?.routes?.length) return undefined;
  const route = state.routes[state.index ?? 0];
  if (route?.state) {
    return getFocusedRouteName(route.state) ?? route.name;
  }
  return route?.name;
}

function getFocusedRouteParams(state) {
  if (!state?.routes?.length) return undefined;
  const route = state.routes[state.index ?? 0];
  if (route?.state) {
    return getFocusedRouteParams(route.state) ?? route.params;
  }
  return route?.params;
}

function getActivePaymentRoot() {
  const rootState = navigationRef.getRootState();
  if (!rootState?.routes?.length) return null;
  const top = rootState.routes[rootState.index ?? 0];
  if (!top?.name || !PAYMENT_ROOTS.has(top.name)) return null;
  return top.name;
}

function isAlreadyOnPaymentResult(paymentId) {
  const rootState = navigationRef.getRootState();
  if (!rootState?.routes?.length) return false;
  const top = rootState.routes[rootState.index ?? 0];
  if (!PAYMENT_ROOTS.has(top?.name) || !top?.state) return false;
  const focused = getFocusedRouteName(top.state);
  if (focused !== "PaymentResult") return false;
  const params = getFocusedRouteParams(top.state);
  return String(params?.paymentId || "") === String(paymentId);
}

function isAlreadyOnCheckout(screenName, matchParams = {}) {
  const rootState = navigationRef.getRootState();
  if (!rootState?.routes?.length) return false;
  const top = rootState.routes[rootState.index ?? 0];
  if (!PAYMENT_ROOTS.has(top?.name) || !top?.state) return false;
  const focused = getFocusedRouteName(top.state);
  if (focused !== screenName) return false;
  const params = getFocusedRouteParams(top.state) || {};
  if (matchParams.orderId != null && Number(params?.order?.id) !== Number(matchParams.orderId)) {
    return false;
  }
  if (matchParams.batchId != null && String(params?.batchId) !== String(matchParams.batchId)) {
    return false;
  }
  return true;
}

function deferNavigate(dispatchFn) {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        resolve(dispatchFn());
      }, 150);
    });
  });
}

/**
 * Open PaymentResult on the customer/depot root stack (works after ABA return or app resume).
 */
export function navigateToPaymentResult({
  paymentId,
  orderId,
  batchId,
  orderIds,
  fromAbaReturn,
  role = "Customer",
}) {
  if (!paymentId || !navigationRef.isReady()) return false;

  if (isAlreadyOnPaymentResult(paymentId)) return true;

  const activeRoot = getActivePaymentRoot();
  if (!activeRoot) return false;

  const root = activeRoot || rootForRole(role);
  const params = {
    paymentId: String(paymentId),
    orderId: orderId != null ? Number(orderId) : undefined,
    batchId: batchId != null ? String(batchId) : undefined,
    orderIds: Array.isArray(orderIds) ? orderIds.map((id) => Number(id)) : undefined,
    fromAbaReturn: fromAbaReturn !== false,
  };

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: root,
        params: {
          screen: "PaymentResult",
          params,
        },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Defer navigation until after the activity transition from ABA return finishes.
 */
export function navigateToPaymentResultDeferred(options) {
  return deferNavigate(() => navigateToPaymentResult(options));
}

export function navigateToOrderPayment({ order, role = "Customer" }) {
  if (!order?.id || !navigationRef.isReady()) return false;

  if (isAlreadyOnCheckout("OrderPayment", { orderId: order.id })) return true;

  const activeRoot = getActivePaymentRoot();
  if (!activeRoot) return false;

  const root = activeRoot || rootForRole(role);

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: root,
        params: {
          screen: "OrderPayment",
          params: { order },
        },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function navigateToBatchOrderPayment({ batchId, orders, role = "Depot" }) {
  if (!batchId || !navigationRef.isReady()) return false;

  if (isAlreadyOnCheckout("BatchOrderPayment", { batchId })) return true;

  const activeRoot = getActivePaymentRoot();
  if (!activeRoot) return false;

  const root = activeRoot || rootForRole(role);

  try {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: root,
        params: {
          screen: "BatchOrderPayment",
          params: { batchId: String(batchId), orders: orders || [] },
        },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function navigateToOrderPaymentDeferred(options) {
  return deferNavigate(() => navigateToOrderPayment(options));
}

export function navigateToBatchOrderPaymentDeferred(options) {
  return deferNavigate(() => navigateToBatchOrderPayment(options));
}
