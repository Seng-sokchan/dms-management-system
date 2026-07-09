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
  {
    paymentId,
    orderId,
    masterOrderId,
    orderIds,
    orders,
    order,
    role = "Customer",
    fromAbaReturn = false,
  } = {},
) {
  if (!token || !paymentId) return false;

  let payment;
  try {
    payment = await getPayment(token, paymentId);
  } catch {
    return false;
  }

  const status = payment?.status || "unpaid";
  const resolvedOrderId = orderId != null ? Number(orderId) : payment?.orderId;
  const resolvedMasterOrderId =
    masterOrderId != null
      ? Number(masterOrderId)
      : Array.isArray(payment?.orderIds) && payment.orderIds.length > 1
        ? Number(payment.orderId)
        : undefined;
  const resolvedOrderIds = Array.isArray(orderIds)
    ? orderIds.map((id) => Number(id))
    : Array.isArray(payment?.orderIds)
      ? payment.orderIds.map((id) => Number(id))
      : undefined;

  const resumeCheckout = async () => {
    if (resolvedMasterOrderId) {
      const batchOrders =
        Array.isArray(orders) && orders.length
          ? orders
          : (resolvedOrderIds || []).map((id) => ({ id }));
      return navigateToBatchOrderPaymentDeferred({
        masterOrderId: resolvedMasterOrderId,
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

  if (status === "paid") {
    return navigateToPaymentResultDeferred({
      paymentId,
      orderId: resolvedOrderId,
      masterOrderId: resolvedMasterOrderId,
      orderIds: resolvedOrderIds,
      fromAbaReturn: fromAbaReturn === true,
      role,
    });
  }

  if (status === "expired" || isIntentExpired(payment?.expiresAt)) {
    return false;
  }

  if (status === "unpaid") {
    return resumeCheckout();
  }

  return false;
}

export { CHECKOUT_SCREENS, isIntentExpired };
