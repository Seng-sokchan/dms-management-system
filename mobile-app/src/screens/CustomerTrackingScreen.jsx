import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { DeliveryMapSection } from "../components/DeliveryMapSection";
import DeliveryProgressCard from "../components/DeliveryProgressCard";
import OrderStatusSteps from "../components/OrderStatusSteps";
import TrackingOrderChips from "../components/TrackingOrderChips";
import { Card, EmptyState, ErrorBanner, Screen, SectionHeader, TrackingChipsSkeleton } from "../components/ui";
import { useDeliveryLocationHistory } from "../hooks/useDeliveryLocationHistory";
import { useDeliveryRouteProgress } from "../hooks/useDeliveryRouteProgress";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { getOrderDestination, resolveActiveTrackableOrderId } from "../utils/deliveryNavigation";
import {
  ensureDriverLocationReady,
  getCurrentDriverPositionAsync,
} from "../utils/driverLocationProvider";
import { getSocketStatusLabel } from "../utils/trackingLabels";

const TRACKABLE_STATUS = "Ready_For_Delivery";

export default function CustomerTrackingScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography, sizes } = useTheme();
  const socketRef = useRef(null);
  const applyLiveRef = useRef(null);
  const applySubscribeRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [myLocation, setMyLocation] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [socketState, setSocketState] = useState("idle");
  const [error, setError] = useState("");
  const [mapDirectionsError, setMapDirectionsError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        scrollContent: {
          paddingBottom: sizes.tabBarOffset + spacing.lg,
        },
        ordersCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
        cardTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
          marginBottom: spacing.sm,
        },
        statusLine: {
          marginTop: spacing.md,
          color: colors.textMuted,
          fontSize: typography.caption,
          fontWeight: "500",
        },
      }),
    [colors, sizes.tabBarOffset, spacing, typography],
  );

  const trackableOrders = useMemo(
    () => orders.filter((row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId),
    [orders],
  );

  const selectedOrder = useMemo(
    () => trackableOrders.find((row) => String(row.id) === String(selectedOrderId)),
    [trackableOrders, selectedOrderId],
  );

  const deliveryDestination = useMemo(() => {
    if (!selectedOrder) return myLocation;
    return getOrderDestination(selectedOrder) || myLocation;
  }, [selectedOrder, myLocation]);

  const driverName = selectedOrder?.deliveryAgentName || t("tracking.driver");

  const {
    lastKnown,
    loading: historyLoading,
    error: historyError,
    isStale,
    applyLiveLocation,
    applySubscribeLastKnown,
    reset: resetHistory,
  } = useDeliveryLocationHistory({
    token,
    orderId: selectedOrderId,
    deliveryAgentId: selectedOrder?.deliveryAgentId,
    driverName,
    enabled: Boolean(selectedOrderId && selectedOrder),
  });

  applyLiveRef.current = applyLiveLocation;
  applySubscribeRef.current = applySubscribeLastKnown;

  const driverLocation = useMemo(() => {
    if (!lastKnown) return null;
    return {
      latitude: lastKnown.latitude,
      longitude: lastKnown.longitude,
      updatedAt: lastKnown.recordedAt,
      name: lastKnown.name || driverName,
    };
  }, [driverName, lastKnown]);

  const { progressRows, resetRoute, isLoadingRoute, directionsError } = useDeliveryRouteProgress({
    origin: driverLocation,
    destination: deliveryDestination,
    driverName: driverLocation?.name || driverName,
    audience: "customer",
    orderStatus: selectedOrder?.status,
  });

  const subscribeSelectedOrder = useCallback(
    (orderId) => {
      if (!orderId || !socketRef.current?.connected) return;
      socketRef.current.emit("subscribe:customer-order-tracking", { orderId }, (ack) => {
        if (!ack?.ok) {
          setError(ack?.error || t("tracking.subscribeError"));
          return;
        }
        setError("");
        if (ack?.lastKnown) {
          applySubscribeRef.current?.(ack.lastKnown);
        }
      });
    },
    [t],
  );

  const loadOrdersAndLocation = useCallback(async () => {
    setLoadingOrders(true);
    setError("");
    try {
      const rows = await listMobileOrders(token);
      setOrders(rows);
    } catch (err) {
      setError(getApiErrorMessage(err, t("tracking.loadFailed")));
    } finally {
      setLoadingOrders(false);
    }
    const ok = await ensureDriverLocationReady();
    if (!ok) return;
    try {
      const info = await getCurrentDriverPositionAsync({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });
      setMyLocation({
        latitude: info.coords.latitude,
        longitude: info.coords.longitude,
      });
    } catch {
      /* destination falls back to order coords */
    }
  }, [token, t]);

  const linkedOrderId = useMemo(
    () =>
      resolveActiveTrackableOrderId(trackableOrders, {
        driverLat: driverLocation?.latitude,
        driverLng: driverLocation?.longitude,
        currentId: selectedOrderId,
      }),
    [trackableOrders, driverLocation?.latitude, driverLocation?.longitude, selectedOrderId],
  );

  useEffect(() => {
    if (!linkedOrderId || linkedOrderId === selectedOrderId) return;
    setSelectedOrderId(linkedOrderId);
    resetHistory();
    resetRoute();
    setMapDirectionsError("");
  }, [linkedOrderId, resetHistory, resetRoute, selectedOrderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrdersAndLocation().catch(() => {});
    }, [loadOrdersAndLocation]),
  );

  useFocusEffect(
    useCallback(() => {
      const baseUrl = getSocketBaseUrl();
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!baseUrl || !accessToken) return () => {};
      const socket = io(baseUrl, {
        auth: { token: accessToken },
        query: { token: accessToken },
        extraHeaders: { Authorization: `Bearer ${accessToken}` },
        transports: ["polling", "websocket"],
      });
      socketRef.current = socket;
      socket.on("connect", () => {
        setSocketState("connected");
        subscribeSelectedOrder(selectedOrderId);
      });
      socket.on("disconnect", () => setSocketState("disconnected"));
      socket.on("delivery:location", (payload) => {
        applyLiveRef.current?.(payload);
      });
      socket.on("connect_error", (err) => {
        setSocketState("error");
        setError(err?.message || t("tracking.socketFailed"));
      });
      return () => {
        socketRef.current = null;
        socket.removeAllListeners();
        socket.disconnect();
      };
    }, [selectedOrderId, subscribeSelectedOrder, token, t]),
  );

  useFocusEffect(
    useCallback(() => {
      subscribeSelectedOrder(selectedOrderId);
      return () => {};
    }, [selectedOrderId, subscribeSelectedOrder]),
  );

  const getOrderSubtitle = useCallback(
    (item) => item.deliveryTime || t("orderStatus.readyForDelivery"),
    [t],
  );

  const connectionLabel = useMemo(() => {
    if (socketState === "connected" && lastKnown && !isStale) {
      return t("tracking.live");
    }
    if (lastKnown && isStale) {
      return t("tracking.lastKnownShort");
    }
    if (socketState === "connected") {
      return t("tracking.live");
    }
    return getSocketStatusLabel(socketState, t);
  }, [isStale, lastKnown, socketState, t]);

  const displayError = error || historyError;

  const busy =
    (loadingOrders && orders.length === 0)
    || (Boolean(selectedOrderId) && (historyLoading || isLoadingRoute));

  return (
    <Screen contentStyle={styles.container} busy={busy}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title={t("tracking.title")} subtitle={t("tracking.subtitle")} />

        <Card style={styles.ordersCard}>
          <Text style={styles.cardTitle}>{t("tracking.activeOrders")}</Text>
          {loadingOrders ? (
            <TrackingChipsSkeleton />
          ) : trackableOrders.length === 0 ? (
            <EmptyState
              icon="map-marker-radius"
              title={t("tracking.noOrders")}
              action={
                <Pressable onPress={() => loadOrdersAndLocation()} accessibilityRole="button">
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("common.tryAgain")}</Text>
                </Pressable>
              }
            />
          ) : (
            <TrackingOrderChips
              orders={trackableOrders}
              linkedOrderId={linkedOrderId}
              getSubtitle={getOrderSubtitle}
            />
          )}
          <Text style={styles.statusLine}>
            {t("tracking.connection")} · {connectionLabel}
          </Text>
        </Card>

        {selectedOrder ? (
          <>
            <OrderStatusSteps status={selectedOrder.status} />
            <DeliveryMapSection
              audience="watcher"
              hideHeader
              driverLocation={driverLocation}
              activeNavOrder={selectedOrder}
              activeNavOrderId={selectedOrder.id}
              activeDestination={deliveryDestination}
              directionsOrigin={driverLocation}
              directionsError={mapDirectionsError || directionsError}
              readyForDeliveryOrders={[]}
              readyOrdersMissingCoordsCount={0}
              onDirectionsError={setMapDirectionsError}
              onRouteReady={() => setMapDirectionsError("")}
            />
            <DeliveryProgressCard title={t("tracking.progress.title")} rows={progressRows} />
          </>
        ) : null}

        {displayError ? (
          <ErrorBanner
            title={t("tracking.title")}
            message={displayError}
            onRetry={loadOrdersAndLocation}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
