import { getPayment } from "../services/paymentsApi";
import {
  navigateToBatchOrderPaymentDeferred,
  navigateToOrderPaymentDeferred,
  navigateToPaymentResultDeferred,
} from "../navigation/paymentReturnNavigation";

const CHECKOUT_SCREENS = new Set(["OrderPayment", "BatchOrderPayment"]);

function isIntentExpired(expiresAt) {
  if (!expiresAt) return false;
  const expires = new Date(expiresAt);
  return Number.isFinite(expires.getTime()) && expires <= new Date();
}

/**
 * Route after ABA return or app resume based on live payment status.
 * PaymentResult is shown only when status is paid.
 */
export async function resolvePaymentReturnNavigation(
  token,
  { paymentId, orderId, batchId, orderIds, orders, order, role = "Customer" } = {},
) {
  if (!token || !paymentId) return false;

  let payment;
  try {
    payment = await getPayment(token, paymentId);
  } catch {
    return false;
  }

  const status = payment?.status || "pending";
  const resolvedOrderId = orderId != null ? Number(orderId) : payment?.orderId;
  const resolvedBatchId = batchId != null ? String(batchId) : undefined;
  const resolvedOrderIds = Array.isArray(orderIds)
    ? orderIds.map((id) => Number(id))
    : Array.isArray(payment?.orderIds)
      ? payment.orderIds.map((id) => Number(id))
      : undefined;

  if (status === "paid") {
    return navigateToPaymentResultDeferred({
      paymentId,
      orderId: resolvedOrderId,
      batchId: resolvedBatchId,
      orderIds: resolvedOrderIds,
      fromAbaReturn: false,
      role,
    });
  }

  const resumeCheckout = async () => {
    if (resolvedBatchId) {
      const batchOrders =
        Array.isArray(orders) && orders.length
          ? orders
          : (resolvedOrderIds || []).map((id) => ({ id }));
      return navigateToBatchOrderPaymentDeferred({
        batchId: resolvedBatchId,
        orders: batchOrders,
        role,
      });
    }
    if (resolvedOrderId) {
      const checkoutOrder =
        order && order.id != null ? order : { id: resolvedOrderId };
      return navigateToOrderPaymentDeferred({
        order: checkoutOrder,
        role,
      });
    }
    return false;
  };

  if (status === "pending" && !isIntentExpired(payment?.expiresAt)) {
    return resumeCheckout();
  }

  if (status === "failed" || status === "expired" || status === "cancelled") {
    return resumeCheckout();
  }

  return resumeCheckout();
}

export { CHECKOUT_SCREENS, isIntentExpired };
