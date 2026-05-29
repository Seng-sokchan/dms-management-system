import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DeliveryProgressCard from "../components/DeliveryProgressCard";
import { Card, Screen, SectionHeader, TrackingChipsSkeleton } from "../components/ui";
import { useDeliveryLocationHistory } from "../hooks/useDeliveryLocationHistory";
import { useDeliveryRouteProgress } from "../hooks/useDeliveryRouteProgress";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { getOrderDestination } from "../utils/deliveryNavigation";

const TRACKABLE_STATUS = "Ready_For_Delivery";

export default function DepotTrackingScreen({ route }) {
  const initialOrderId = route?.params?.orderId;
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const socketRef = useRef(null);
  const applyLiveRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(
    initialOrderId != null ? String(initialOrderId) : "",
  );
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [socketState, setSocketState] = useState("idle");
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { paddingBottom: spacing.sm },
        ordersCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
        cardTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
          marginBottom: spacing.sm,
        },
        muted: { color: colors.textMuted, fontSize: typography.bodySmall, lineHeight: 18 },
        statusLine: {
          marginTop: spacing.md,
          color: colors.textMuted,
          fontSize: typography.caption,
          fontWeight: "500",
        },
        chipList: { paddingVertical: spacing.xs },
        orderChip: {
          marginRight: spacing.sm,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surfaceSoft,
        },
        orderChipActive: { backgroundColor: colors.primary },
        orderChipTitle: {
          color: colors.textPrimary,
          fontWeight: "600",
          fontSize: typography.bodySmall,
        },
        orderChipTitleActive: { color: colors.onPrimary },
        orderChipSub: { color: colors.textMuted, marginTop: 2, fontSize: typography.caption },
        orderChipSubActive: { color: colors.onPrimary, opacity: 0.72 },
        errorText: {
          color: colors.danger,
          marginTop: spacing.sm,
          fontSize: typography.caption,
          fontWeight: "600",
        },
      }),
    [colors, radii, spacing, typography],
  );

  const trackableOrders = useMemo(
    () => orders.filter((row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId),
    [orders],
  );

  const selectedOrder = useMemo(
    () => trackableOrders.find((row) => String(row.id) === String(selectedOrderId)),
    [trackableOrders, selectedOrderId],
  );

  const customerLocation = useMemo(
    () => (selectedOrder ? getOrderDestination(selectedOrder) : null),
    [selectedOrder],
  );

  const driverName = selectedOrder?.deliveryAgentName || t("tracking.driver");

  const {
    lastKnown,
    loading: historyLoading,
    error: historyError,
    isStale,
    applyLiveLocation,
    reset: resetHistory,
  } = useDeliveryLocationHistory({
    token,
    orderId: selectedOrderId,
    deliveryAgentId: selectedOrder?.deliveryAgentId,
    driverName,
    enabled: Boolean(selectedOrderId && selectedOrder),
  });

  applyLiveRef.current = applyLiveLocation;

  const driverLocation = useMemo(() => {
    if (!lastKnown) return null;
    return {
      latitude: lastKnown.latitude,
      longitude: lastKnown.longitude,
      updatedAt: lastKnown.recordedAt,
      name: lastKnown.name || driverName,
    };
  }, [driverName, lastKnown]);

  const { progressRows, resetRoute, isLoadingRoute } = useDeliveryRouteProgress({
    origin: driverLocation,
    destination: customerLocation,
    driverName: driverLocation?.name || driverName,
    audience: "depot",
    customerName: selectedOrder?.customerName,
    orderStatus: selectedOrder?.status,
  });

  const subscribeWatcher = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("subscribe:delivery-locations");
    setError("");
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadOrders() {
        setLoadingOrders(true);
        setError("");
        try {
          const rows = await listMobileOrders(token);
          if (cancelled) return;
          setOrders(rows);
          const trackable = rows.filter(
            (row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId,
          );
          if (initialOrderId && trackable.some((row) => String(row.id) === String(initialOrderId))) {
            setSelectedOrderId(String(initialOrderId));
          } else if (!selectedOrderId && trackable[0]?.id) {
            setSelectedOrderId(String(trackable[0].id));
          } else if (selectedOrderId) {
            const stillVisible = trackable.some((row) => String(row.id) === String(selectedOrderId));
            if (!stillVisible) {
              setSelectedOrderId(trackable[0]?.id ? String(trackable[0].id) : "");
              resetHistory();
            }
          }
        } catch (err) {
          if (!cancelled) setError(getApiErrorMessage(err, t("depot.trackingLoadFailed")));
        } finally {
          if (!cancelled) setLoadingOrders(false);
        }
      }

      void loadOrders();

      return () => {
        cancelled = true;
      };
    }, [initialOrderId, resetHistory, selectedOrderId, token, t]),
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
        subscribeWatcher();
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
    }, [subscribeWatcher, token, t]),
  );

  useFocusEffect(
    useCallback(() => {
      subscribeWatcher();
      return () => {};
    }, [selectedOrderId, subscribeWatcher]),
  );

  const renderOrder = ({ item }) => {
    const isActive = String(item.id) === String(selectedOrderId);
    const driverLabel = item.deliveryAgentName || t("tracking.driver");
    return (
      <Pressable
        onPress={() => {
          setSelectedOrderId(String(item.id));
          resetHistory();
          resetRoute();
        }}
        style={[styles.orderChip, isActive && styles.orderChipActive]}
      >
        <Text style={[styles.orderChipTitle, isActive && styles.orderChipTitleActive]}>
          {t("tracking.orderLabel", { id: item.id, name: item.itemName || "Order" })}
        </Text>
        <Text style={[styles.orderChipSub, isActive && styles.orderChipSubActive]}>
          {t("depot.trackingDriver", { name: driverLabel })}
        </Text>
      </Pressable>
    );
  };

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
    return socketState;
  }, [isStale, lastKnown, socketState, t]);

  const displayError = error || historyError;

  const busy =
    (loadingOrders && orders.length === 0)
    || (Boolean(selectedOrderId) && (historyLoading || isLoadingRoute));

  return (
    <Screen contentStyle={styles.container} busy={busy}>
      <SectionHeader title={t("depot.trackingTitle")} subtitle={t("depot.trackingSubtitle")} />

      <Card style={styles.ordersCard}>
        <Text style={styles.cardTitle}>{t("depot.trackingActiveOrders")}</Text>
        {loadingOrders ? (
          <TrackingChipsSkeleton />
        ) : trackableOrders.length === 0 ? (
          <Text style={styles.muted}>{t("depot.trackingNoOrders")}</Text>
        ) : (
          <FlatList
            horizontal
            data={trackableOrders}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOrder}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          />
        )}
        <Text style={styles.statusLine}>
          {t("tracking.connection")} · {connectionLabel}
        </Text>
      </Card>

      {selectedOrder ? (
        <DeliveryProgressCard title={t("tracking.progress.title")} rows={progressRows} />
      ) : null}

      {displayError ? (
        <Pressable onPress={() => Alert.alert(t("depot.trackingTitle"), displayError)}>
          <Text style={styles.errorText}>{displayError}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
