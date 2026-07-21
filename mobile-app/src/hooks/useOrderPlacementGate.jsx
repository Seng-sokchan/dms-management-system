import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { listMobileOrders } from "../services/ordersApi";
import { fetchSpecialDaySettings } from "../services/systemSettingsApi";
import {
  findUnpaidReceivedOrder,
  normalizeUnpaidReceivedLimit,
} from "../utils/orderPlacementGate";
import { useOrderWindow } from "./useOrderWindow";
import { usePaymentCompletionRefresh } from "./usePaymentCompletionRefresh";

export function useOrderPlacementGate({ enabled = true } = {}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blockerOrder, setBlockerOrder] = useState(null);
  const [unpaidReceivedLimit, setUnpaidReceivedLimit] = useState(1);
  const { orderWindowOpen, orderWindowClosed } = useOrderWindow({ enabled });

  const refresh = useCallback(async () => {
    if (!enabled || !token) {
      setBlockerOrder(null);
      setUnpaidReceivedLimit(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [orders, settings] = await Promise.all([
        listMobileOrders(token),
        fetchSpecialDaySettings(token).catch(() => null),
      ]);
      const limit = normalizeUnpaidReceivedLimit(settings?.unpaidReceivedLimit);
      setUnpaidReceivedLimit(limit);
      setBlockerOrder(findUnpaidReceivedOrder(orders, limit));
    } catch {
      setBlockerOrder(null);
      setUnpaidReceivedLimit(1);
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
    unpaidReceivedLimit,
    orderWindowOpen,
    orderWindowClosed,
    canPlaceOrder: !blockerOrder && orderWindowOpen,
    refresh,
  };
}
