import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getPendingPaymentReturn } from "../services/paymentPendingStorage";
import { markPaymentReturnHandled, wasPaymentReturnHandled } from "../services/paymentReturnHandled";
import { resolvePaymentReturnNavigation } from "../utils/paymentReturnRouting";

const PAYMENT_SUCCESS_PATH = "/payment/result/success";

function parsePaymentReturnUrl(url) {
  if (!url || typeof url !== "string") return null;
  const normalized = url.trim();
  if (!normalized.toLowerCase().startsWith("dms://")) return null;
  try {
    const withScheme = normalized.replace(/^dms:\/\//i, "https://dms/");
    const parsed = new URL(withScheme);
    const path = parsed.pathname || "";
    if (!path.includes(PAYMENT_SUCCESS_PATH)) return null;
    const paymentId = parsed.searchParams.get("paymentId") || parsed.searchParams.get("payment_id");
    if (!paymentId) return null;
    const fromAba = parsed.searchParams.get("fromAba");
    return {
      paymentId: String(paymentId),
      fromAbaReturn: fromAba === "1" || fromAba === "true",
    };
  } catch {
    return null;
  }
}

/**
 * Role-aware handler for dms://payment/result/success (React Navigation linking disabled).
 */
export function usePaymentDeepLink({ enabled = false } = {}) {
  const { token } = useAuth();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!enabled) return undefined;

    const handlePaymentReturnUrl = async (url) => {
      const authToken = tokenRef.current;
      if (!authToken) return;

      const parsed = parsePaymentReturnUrl(url);
      if (!parsed?.paymentId) return;
      if (wasPaymentReturnHandled(parsed.paymentId)) return;

      const pending = await getPendingPaymentReturn();
      const paymentId = parsed.paymentId || pending?.paymentId;
      if (!paymentId) return;

      const ok = await resolvePaymentReturnNavigation(authToken, {
        paymentId,
        orderId: pending?.orderId,
        masterOrderId: pending?.masterOrderId,
        orderIds: pending?.orderIds,
        order: pending?.order,
        orders: pending?.orders,
        role: pending?.role || "Customer",
        fromAbaReturn: parsed.fromAbaReturn,
      });
      if (ok) {
        markPaymentReturnHandled(paymentId);
      }
    };

    const runInitial = () => {
      void Linking.getInitialURL().then((url) => {
        if (url) void handlePaymentReturnUrl(url);
      });
    };

    const initialTimer = setTimeout(runInitial, 200);

    const sub = Linking.addEventListener("url", ({ url }) => {
      void handlePaymentReturnUrl(url);
    });

    return () => {
      clearTimeout(initialTimer);
      sub.remove();
    };
  }, [enabled]);
}
