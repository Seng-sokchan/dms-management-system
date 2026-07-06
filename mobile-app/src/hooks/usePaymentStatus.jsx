import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getPayment } from "../services/paymentsApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = PAYMENT_INTENT_TTL_MS + 30_000;

const TERMINAL = new Set(["paid", "expired"]);

/**
 * Realtime payment status: Socket.IO + automatic GET polling (no manual refresh).
 * @param {string|null} paymentId
 * @param {{ autoRefresh?: boolean }} [options] autoRefresh — poll on interval, app resume, and screen focus
 */
export function usePaymentStatus(paymentId, options = {}) {
  const { autoRefresh = true } = options;
  const { token } = useAuth();
  const [status, setStatus] = useState("unpaid");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const statusRef = useRef(status);

  statusRef.current = status;

  const applyPayment = useCallback((row) => {
    if (!row) return;
    setPayment(row);
    if (row.status) {
      setStatus(row.status);
      statusRef.current = row.status;
    }
  }, []);

  const fetchOnce = useCallback(async () => {
    if (!token || !paymentId) return;
    try {
      const row = await getPayment(token, paymentId);
      applyPayment(row);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }, [applyPayment, paymentId, token]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current || !autoRefresh) return;
    pollRef.current = setInterval(() => {
      if (TERMINAL.has(statusRef.current)) {
        stopPolling();
        return;
      }
      if (Date.now() - startedAtRef.current > POLL_MAX_MS) {
        stopPolling();
        return;
      }
      void fetchOnce();
    }, POLL_INTERVAL_MS);
  }, [autoRefresh, fetchOnce, stopPolling]);

  useEffect(() => {
    if (!token || !paymentId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    startedAtRef.current = Date.now();
    void fetchOnce();

    const socket = io(getSocketBaseUrl(), {
      transports: ["polling", "websocket"],
      auth: { token },
      query: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:payments", {}, () => {});
    });

    socket.on("payment:status", (payload) => {
      if (!payload || payload.paymentId !== paymentId) return;
      setStatus(payload.status);
      statusRef.current = payload.status;
      setPayment((prev) => ({ ...prev, ...payload }));
      setLoading(false);
      if (TERMINAL.has(payload.status)) stopPolling();
    });

    if (autoRefresh) {
      startPolling();
    }

    return () => {
      stopPolling();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoRefresh, fetchOnce, paymentId, startPolling, stopPolling, token]);

  useEffect(() => {
    if (TERMINAL.has(status)) stopPolling();
  }, [status, stopPolling]);

  useEffect(() => {
    if (!autoRefresh || !paymentId) return undefined;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || TERMINAL.has(statusRef.current)) return;
      void fetchOnce();
    });
    return () => sub.remove();
  }, [autoRefresh, fetchOnce, paymentId]);

  useFocusEffect(
    useCallback(() => {
      if (!autoRefresh || !paymentId || !token) return;
      if (TERMINAL.has(statusRef.current)) return;
      void fetchOnce();
    }, [autoRefresh, fetchOnce, paymentId, token]),
  );

  return { status, payment, loading, error };
}
