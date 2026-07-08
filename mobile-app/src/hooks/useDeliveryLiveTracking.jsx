import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import { io } from "socket.io-client";
import { useAlert } from "../context/AlertContext";
import i18n from "../i18n/config";
import { getSocketBaseUrl } from "../services/socketUrl";
import {
  clearDriverWatch,
  ensureDriverLocationReady,
  watchDriverPosition,
} from "../utils/driverLocationProvider";
import { haversineMeters, shouldRefreshByDistance } from "../utils/deliveryNavigation";

const EMIT_MIN_INTERVAL_MS = 8000;
const MOVE_EMIT_THRESHOLD_M = 35;
const UI_LOCATION_MIN_INTERVAL_MS = 2000;
const UI_LOCATION_MOVE_THRESHOLD_M = 40;

const ANDROID_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 15,
  interval: 10000,
  fastestInterval: 5000,
  timeout: 25000,
  maximumAge: 10000,
};

const IOS_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 15,
  timeout: 25000,
  maximumAge: 10000,
};

/**
 * Live GPS + Socket.IO for delivery agents.
 * Socket emits use full GPS rate; React `driverLocation` is throttled for UI.
 */
export function useDeliveryLiveTracking({
  token,
  shouldTrack,
  mapVisible,
  onPositionForNav,
}) {
  const { showError, showWarning } = useAlert();
  const [trackingStatus, setTrackingStatus] = useState("idle");
  const [driverLocation, setDriverLocation] = useState(null);

  const driverLocationRef = useRef(null);
  const lastUiLocationAt = useRef(0);
  const lastUiLat = useRef(null);
  const lastUiLng = useRef(null);
  const lastEmitAt = useRef(0);
  const lastLat = useRef(null);
  const lastLng = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const pendingLocationRef = useRef(null);
  const locationErrorShownRef = useRef(false);
  const onPositionForNavRef = useRef(onPositionForNav);

  onPositionForNavRef.current = onPositionForNav;

  const applyDriverLocation = useCallback((loc, { forceUi = false } = {}) => {
    driverLocationRef.current = loc;
    const now = Date.now();
    const timeOk = now - lastUiLocationAt.current >= UI_LOCATION_MIN_INTERVAL_MS;
    const moveOk =
      forceUi ||
      lastUiLat.current == null ||
      lastUiLng.current == null ||
      shouldRefreshByDistance(
        { latitude: lastUiLat.current, longitude: lastUiLng.current },
        loc,
        UI_LOCATION_MOVE_THRESHOLD_M,
      );
    if (!forceUi && !timeOk && !moveOk) return;
    lastUiLocationAt.current = now;
    lastUiLat.current = loc.latitude;
    lastUiLng.current = loc.longitude;
    setDriverLocation(loc);
  }, []);

  useEffect(() => {
    let cancelled = false;

    function emitLocation(latitude, longitude, accuracy) {
      const payload = {
        latitude,
        longitude,
        accuracy: accuracy != null ? Number(accuracy) : undefined,
      };
      if (socketRef.current?.connected) {
        socketRef.current.emit("delivery:location", payload);
        pendingLocationRef.current = null;
        setTrackingStatus("active");
        return;
      }
      pendingLocationRef.current = payload;
    }

    function handlePosition(info) {
      const { latitude, longitude, accuracy } = info.coords;
      const loc = { latitude, longitude };
      driverLocationRef.current = loc;

      onPositionForNavRef.current?.(latitude, longitude);
      applyDriverLocation(loc);

      const now = Date.now();
      const prevLat = lastLat.current;
      const prevLng = lastLng.current;
      let canEmit = now - lastEmitAt.current >= EMIT_MIN_INTERVAL_MS;
      if (!canEmit && prevLat != null && prevLng != null) {
        const moved = haversineMeters(prevLat, prevLng, latitude, longitude);
        if (moved >= MOVE_EMIT_THRESHOLD_M) canEmit = true;
      }
      if (!canEmit) return;
      lastEmitAt.current = now;
      lastLat.current = latitude;
      lastLng.current = longitude;
      emitLocation(latitude, longitude, accuracy);
    }

    function handleLocationError(error) {
      if (cancelled || locationErrorShownRef.current) return;
      locationErrorShownRef.current = true;
      setTrackingStatus("location_error");
      const code = error?.code;
      const message =
        code === 1
          ? i18n.t("delivery.locationDenied")
          : code === 2
            ? i18n.t("delivery.locationUnavailable")
            : i18n.t("delivery.locationReadFailed");
      showWarning(i18n.t("delivery.locationTitle"), message, {
        actions: [
          { text: i18n.t("common.cancel"), style: "cancel" },
          { text: i18n.t("common.openSettings"), onPress: () => Linking.openSettings() },
        ],
      });
    }

    async function startTracking() {
      if (!shouldTrack) {
        setTrackingStatus("idle");
        return;
      }

      setTrackingStatus("starting");
      locationErrorShownRef.current = false;

      const ok = await ensureDriverLocationReady();
      if (cancelled) return;
      if (!ok) {
        setTrackingStatus("permission_denied");
        showWarning(i18n.t("delivery.locationOffTitle"), i18n.t("delivery.locationOffMessage"), {
          actions: [
            { text: i18n.t("common.cancel"), style: "cancel" },
            { text: i18n.t("common.openSettings"), onPress: () => Linking.openSettings() },
          ],
        });
        return;
      }

      const baseUrl = getSocketBaseUrl();
      if (!baseUrl) {
        setTrackingStatus("config_error");
        showError(i18n.t("delivery.configTitle"), i18n.t("delivery.configMissingApi"));
        return;
      }
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) {
        setTrackingStatus("session_error");
        showError(i18n.t("delivery.sessionTitle"), i18n.t("delivery.sessionExpired"));
        return;
      }

      setTrackingStatus("connecting");
      const socket = io(baseUrl, {
        auth: { token: accessToken },
        query: { token: accessToken },
        extraHeaders: { Authorization: `Bearer ${accessToken}` },
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (cancelled) return;
        setTrackingStatus("connected");
        if (pendingLocationRef.current) {
          socket.emit("delivery:location", pendingLocationRef.current);
          pendingLocationRef.current = null;
        }
      });
      socket.on("disconnect", () => {
        if (!cancelled) setTrackingStatus("disconnected");
      });
      socket.on("connect_error", (err) => {
        if (cancelled) return;
        setTrackingStatus("socket_error");
        showError(
          i18n.t("delivery.connectionTitle"),
          err?.message || i18n.t("delivery.connectionFailed"),
        );
      });

      if (mapVisible) {
        watchIdRef.current = watchDriverPosition(
          handlePosition,
          handleLocationError,
          Platform.OS === "android" ? ANDROID_WATCH_OPTIONS : IOS_WATCH_OPTIONS,
        );
      }
    }

    startTracking().catch(() => {});

    return () => {
      cancelled = true;
      setTrackingStatus("idle");
      pendingLocationRef.current = null;
      if (watchIdRef.current != null) {
        clearDriverWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [applyDriverLocation, mapVisible, shouldTrack, showError, showWarning, token]);

  const setDriverLocationImmediate = useCallback((loc) => {
    if (loc) applyDriverLocation(loc, { forceUi: true });
  }, [applyDriverLocation]);

  return {
    trackingStatus,
    driverLocation,
    driverLocationRef,
    setDriverLocationImmediate,
  };
}
