import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getPendingPaymentReturn } from "../services/paymentPendingStorage";
import { markPaymentReturnHandled, wasPaymentReturnHandled } from "../services/paymentReturnHandled";
import { resolvePaymentReturnNavigation } from "../utils/paymentReturnRouting";

const RESUME_DELAY_MS = 900;

/**
 * Fallback when user returns from ABA without firing dms:// deeplink.
 */
export function usePaymentReturnResume({ enabled = false } = {}) {
  const { token } = useAuth();
  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token) return undefined;

    const appSub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (prev === "background" && nextState === "active") {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void (async () => {
            const pending = await getPendingPaymentReturn();
            if (!pending?.paymentId) return;
            if (wasPaymentReturnHandled(pending.paymentId)) return;

            const ok = await resolvePaymentReturnNavigation(token, {
              paymentId: pending.paymentId,
              orderId: pending.orderId,
              batchId: pending.batchId,
              orderIds: pending.orderIds,
              order: pending.order,
              orders: pending.orders,
              role: pending.role,
            });
            if (ok) {
              markPaymentReturnHandled(pending.paymentId);
            }
          })();
        }, RESUME_DELAY_MS);
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      appSub.remove();
    };
  }, [enabled, token]);
}
