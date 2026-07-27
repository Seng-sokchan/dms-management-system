import { useEffect, useState } from "react";
import { getMsUntilOrderWindowChange, isOrderWindowOpen } from "../utils/orderWindow";

export function useOrderWindow({ enabled = true } = {}) {
  const [orderWindowOpen, setOrderWindowOpen] = useState(() =>
    enabled ? isOrderWindowOpen() : true,
  );

  useEffect(() => {
    if (!enabled) {
      setOrderWindowOpen(true);
      return undefined;
    }

    let timerId;
    const tick = () => {
      setOrderWindowOpen(isOrderWindowOpen());
      timerId = window.setTimeout(tick, getMsUntilOrderWindowChange());
    };
    tick();
    return () => window.clearTimeout(timerId);
  }, [enabled]);

  return {
    orderWindowOpen,
    orderWindowClosed: !orderWindowOpen,
  };
}
