import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { listMobileOrders } from "../services/ordersApi";
import { findUnpaidReceivedOrder } from "../utils/orderPlacementGate";
import { useOrderWindow } from "./useOrderWindow";
import { usePaymentCompletionRefresh } from "./usePaymentCompletionRefresh";

const UNPAID_RECEIVED_LIMIT = 1;

export function useOrderPlacementGate({ enabled = true } = {}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blockerOrder, setBlockerOrder] = useState(null);
  const { orderWindowOpen, orderWindowClosed } = useOrderWindow({ enabled });

  const refresh = useCallback(async () => {
    if (!enabled || !token) {
      setBlockerOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const orders = await listMobileOrders(token);
      setBlockerOrder(findUnpaidReceivedOrder(orders, UNPAID_RECEIVED_LIMIT));
    } catch {
      setBlockerOrder(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  usePaymentCompletionRefresh(() => {
    void refresh();
  }, enabled);

  return {
    loading,
    blockerOrder,
    unpaidReceivedLimit: UNPAID_RECEIVED_LIMIT,
    orderWindowOpen,
    orderWindowClosed,
    canPlaceOrder: !blockerOrder && orderWindowOpen,
    refresh,
  };
}
