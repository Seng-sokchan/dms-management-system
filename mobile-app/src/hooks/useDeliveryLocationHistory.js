import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrderDeliveryLocation } from "../services/deliveryLocationApi";
import { getApiErrorMessage } from "../services/apiClient";
import { parseCoord } from "../utils/deliveryNavigation";

const POLL_INTERVAL_MS = 45000;
const STALE_AFTER_MS = 90000;

function normalizePoint(raw, driverName = "") {
  const latitude = parseCoord(raw?.latitude);
  const longitude = parseCoord(raw?.longitude);
  if (latitude == null || longitude == null) return null;
  return {
    latitude,
    longitude,
    recordedAt: raw?.recordedAt || raw?.updatedAt || "",
    name: raw?.name || driverName || "",
    accuracy: raw?.accuracy != null ? Number(raw.accuracy) : undefined,
  };
}

/**
 * Loads latest delivery GPS via REST, merges live socket updates, polls while enabled.
 */
export function useDeliveryLocationHistory({
  token,
  orderId,
  deliveryAgentId,
  driverName = "",
  enabled = true,
}) {
  const [lastKnown, setLastKnown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStale, setIsStale] = useState(false);
  const lastUpdateAtRef = useRef(0);
  const pollRef = useRef(null);
  const staleTimerRef = useRef(null);

  const applyLastKnown = useCallback(
    (raw) => {
      const point = normalizePoint(raw, driverName);
      if (!point) return;
      setLastKnown(point);
      lastUpdateAtRef.current = Date.now();
      setIsStale(false);
    },
    [driverName],
  );

  const refresh = useCallback(async () => {
    if (!enabled || !token || !orderId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOrderDeliveryLocation(token, orderId);
      if (
        deliveryAgentId != null &&
        payload?.deliveryAgentId != null &&
        String(payload.deliveryAgentId) !== String(deliveryAgentId)
      ) {
        return;
      }
      if (payload?.lastKnown) {
        applyLastKnown(payload.lastKnown);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyLastKnown, deliveryAgentId, enabled, orderId, token]);

  const applyLiveLocation = useCallback(
    (raw) => {
      const agentId = raw?.deliveryAgentId;
      if (
        deliveryAgentId != null &&
        agentId != null &&
        String(agentId) !== String(deliveryAgentId)
      ) {
        return;
      }
      applyLastKnown({
        latitude: raw?.latitude,
        longitude: raw?.longitude,
        accuracy: raw?.accuracy,
        recordedAt: raw?.updatedAt || raw?.recordedAt,
        name: raw?.name || raw?.username || driverName,
      });
    },
    [applyLastKnown, deliveryAgentId, driverName],
  );

  const applySubscribeLastKnown = applyLastKnown;

  const reset = useCallback(() => {
    setLastKnown(null);
    setError("");
    setIsStale(false);
    lastUpdateAtRef.current = 0;
  }, []);

  useEffect(() => {
    reset();
    if (!enabled || !orderId) return () => {};
    void refresh();
    return () => {};
  }, [enabled, orderId, reset, refresh]);

  useEffect(() => {
    if (!enabled || !orderId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return () => {};
    }
    pollRef.current = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, orderId, refresh]);

  useEffect(() => {
    if (staleTimerRef.current) {
      clearInterval(staleTimerRef.current);
      staleTimerRef.current = null;
    }
    if (!enabled || !lastKnown) return () => {};
    staleTimerRef.current = setInterval(() => {
      const at = lastUpdateAtRef.current;
      if (!at) return;
      setIsStale(Date.now() - at > STALE_AFTER_MS);
    }, 10000);
    return () => {
      if (staleTimerRef.current) {
        clearInterval(staleTimerRef.current);
        staleTimerRef.current = null;
      }
    };
  }, [enabled, lastKnown]);

  return {
    lastKnown,
    loading,
    error,
    isStale,
    refresh,
    applyLiveLocation,
    applySubscribeLastKnown,
    reset,
  };
}
