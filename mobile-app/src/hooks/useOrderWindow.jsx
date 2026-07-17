import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { isOrderWindowOpen } from "../utils/orderWindow";

/** Re-check periodically so UI flips near open/close without a fragile long timer. */
const POLL_INTERVAL_MS = 30_000;

export function useOrderWindow({ enabled = true } = {}) {
  const [orderWindowOpen, setOrderWindowOpen] = useState(() =>
    enabled ? isOrderWindowOpen() : true,
  );

  const refresh = useCallback(() => {
    if (!enabled) {
      setOrderWindowOpen(true);
      return;
    }
    setOrderWindowOpen(isOrderWindowOpen());
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (!enabled) {
      setOrderWindowOpen(true);
      return undefined;
    }

    refresh();
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);

    const onAppStateChange = (nextState) => {
      if (nextState === "active") refresh();
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [enabled, refresh]);

  return {
    orderWindowOpen,
    orderWindowClosed: !orderWindowOpen,
    refresh,
  };
}
