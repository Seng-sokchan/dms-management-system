import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DeliveryProgressCard from "../components/DeliveryProgressCard";
import { Card, Screen, SectionHeader, TrackingChipsSkeleton } from "../components/ui";
import { useDeliveryRouteProgress } from "../hooks/useDeliveryRouteProgress";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { getOrderDestination, parseCoord } from "../utils/deliveryNavigation";

const TRACKABLE_STATUS = "Ready_For_Delivery";

export default function DepotTrackingScreen({ route }) {
  const initialOrderId = route?.params?.orderId;
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(
    initialOrderId != null ? String(initialOrderId) : "",
  );
  const [driverLocation, setDriverLocation] = useState(null);
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

  const { progressRows, resetRoute } = useDeliveryRouteProgress({
    origin: driverLocation,
    destination: customerLocation,
    driverName: driverLocation?.name || selectedOrder?.deliveryAgentName,
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
              setDriverLocation(null);
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
    }, [initialOrderId, selectedOrderId, token, t]),
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
        const latitude = parseCoord(payload?.latitude);
        const longitude = parseCoord(payload?.longitude);
        if (latitude == null || longitude == null) return;

        const payloadAgentId = payload?.deliveryAgentId;
        const orderAgentId = selectedOrder?.deliveryAgentId;
        if (
          orderAgentId &&
          payloadAgentId &&
          String(payloadAgentId) !== String(orderAgentId)
        ) {
          return;
        }

        setDriverLocation({
          latitude,
          longitude,
          updatedAt: payload?.updatedAt || "",
          name:
            payload?.name ||
            payload?.username ||
            selectedOrder?.deliveryAgentName ||
            t("tracking.driver"),
        });
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
    }, [selectedOrder?.deliveryAgentId, selectedOrder?.deliveryAgentName, subscribeWatcher, token, t]),
  );

  useFocusEffect(
    useCallback(() => {
      setDriverLocation(null);
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
          setDriverLocation(null);
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

  const connectionLabel =
    socketState === "connected" ? t("tracking.live") : socketState;

  return (
    <Screen
      contentStyle={styles.container}
      accessibilityState={loadingOrders ? { busy: true } : undefined}
    >
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

      {error ? (
        <Pressable onPress={() => Alert.alert(t("depot.trackingTitle"), error)}>
          <Text style={styles.errorText}>{error}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
