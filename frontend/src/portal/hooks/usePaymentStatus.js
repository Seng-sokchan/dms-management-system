import { useCallback, useEffect, useRef, useState } from "react";
import { PAYMENT_INTENT_TTL_MS } from "../constants/paymentConstants";
import { getPayment } from "../services/payments";

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = PAYMENT_INTENT_TTL_MS + 30_000;
const TERMINAL = new Set(["paid", "expired"]);

/**
 * Poll payment status via GET /payments/:id (local KHQR web flow).
 */
export function usePaymentStatus(token, paymentId, options = {}) {
  const { autoRefresh = true } = options;
  const [status, setStatus] = useState("unpaid");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!token || !paymentId) {
      setLoading(false);
      return undefined;
    }

    startedAtRef.current = Date.now();
    setStatus("unpaid");
    statusRef.current = "unpaid";
    setLoading(true);
    void fetchOnce();

    if (!autoRefresh) return undefined;

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

    return () => stopPolling();
  }, [autoRefresh, fetchOnce, paymentId, stopPolling, token]);

  return { status, payment, loading, error, refresh: fetchOnce };
}
