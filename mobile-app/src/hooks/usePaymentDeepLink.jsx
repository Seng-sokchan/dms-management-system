import { useEffect } from "react";
import { Linking } from "react-native";
import { navigateToPaymentResultDeferred } from "../navigation/paymentReturnNavigation";
import { getPendingPaymentReturn } from "../services/paymentPendingStorage";
import { markPaymentReturnHandled, wasPaymentReturnHandled } from "../services/paymentReturnHandled";

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

async function handlePaymentReturnUrl(url, enabled) {
  if (!enabled) return;
  const parsed = parsePaymentReturnUrl(url);
  if (!parsed?.paymentId) return;
  if (wasPaymentReturnHandled(parsed.paymentId)) return;

  const pending = await getPendingPaymentReturn();
  const paymentId = parsed.paymentId || pending?.paymentId;
  if (!paymentId) return;

  const ok = await navigateToPaymentResultDeferred({
    paymentId,
    orderId: pending?.orderId,
    batchId: pending?.batchId,
    orderIds: pending?.orderIds,
    fromAbaReturn: parsed.fromAbaReturn !== false,
    role: pending?.role || "Customer",
  });
  if (ok) {
    markPaymentReturnHandled(paymentId);
  }
}

/**
 * Role-aware handler for dms://payment/result/success (React Navigation linking disabled).
 */
export function usePaymentDeepLink({ enabled = false } = {}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const runInitial = () => {
      void Linking.getInitialURL().then((url) => {
        if (url) void handlePaymentReturnUrl(url, enabled);
      });
    };

    const initialTimer = setTimeout(runInitial, 200);

    const sub = Linking.addEventListener("url", ({ url }) => {
      void handlePaymentReturnUrl(url, enabled);
    });

    return () => {
      clearTimeout(initialTimer);
      sub.remove();
    };
  }, [enabled]);
}
