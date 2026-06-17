import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getSocketBaseUrl } from "../services/socketUrl";

/**
 * Reload order lists when a payment completes (orders no longer store payment_status).
 */
export function usePaymentCompletionRefresh(onPaid, enabled = true) {
  const { token } = useAuth();
  const callbackRef = useRef(onPaid);
  callbackRef.current = onPaid;

  useEffect(() => {
    if (!enabled || !token) return undefined;

    const socket = io(getSocketBaseUrl(), {
      transports: ["polling", "websocket"],
      auth: { token },
      query: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    });

    socket.on("connect", () => {
      socket.emit("subscribe:payments", {}, () => {});
    });

    socket.on("payment:status", (payload) => {
      if (payload?.status === "paid") {
        callbackRef.current?.(payload);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, token]);
}
