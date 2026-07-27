import { useCallback, useEffect, useState } from "react";
import { listMobileOrders } from "../services/orders";
import { findUnpaidReceivedOrder, UNPAID_RECEIVED_LIMIT } from "../utils/orderPlacementGate";
import { useOrderWindow } from "./useOrderWindow";

export function useOrderPlacementGate({ token, enabled = true } = {}) {
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
