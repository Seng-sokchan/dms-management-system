import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Card, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { ensureLocationPermission } from "../utils/locationPermission";

const TRACKABLE_STATUS = "Ready_For_Delivery";
const PHNOM_PENH_REGION = {
  latitude: 11.5564,
  longitude: 104.9282,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

function parseCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function CustomerTrackingScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, radii, shadows, spacing, typography } = useTheme();
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [socketState, setSocketState] = useState("idle");
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { paddingBottom: spacing.sm },
        loadingWrap: { marginBottom: spacing.md, alignItems: "center" },
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
        mapWrap: {
          flex: 1,
          marginTop: spacing.sm,
          borderRadius: radii.xl,
          overflow: "hidden",
          backgroundColor: colors.surface,
        },
        map: { flex: 1, minHeight: 220 },
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

  const subscribeSelectedOrder = useCallback(
    (orderId) => {
      if (!orderId || !socketRef.current?.connected) return;
      socketRef.current.emit("subscribe:customer-order-tracking", { orderId }, (ack) => {
        if (!ack?.ok) {
          setDriverLocation(null);
          setError(ack?.error || t("tracking.subscribeError"));
          return;
        }
        setError("");
      });
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadOrdersAndLocation() {
        setLoadingOrders(true);
        setError("");
        try {
          const rows = await listMobileOrders(token);
          if (cancelled) return;
          setOrders(rows);
          if (!selectedOrderId) {
            const firstId = rows.find(
              (row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId,
            )?.id;
            if (firstId) setSelectedOrderId(String(firstId));
          } else {
            const stillVisible = rows.some(
              (row) =>
                String(row?.id) === String(selectedOrderId)
                && row?.status === TRACKABLE_STATUS
                && row?.deliveryAgentId,
            );
            if (!stillVisible) {
              setSelectedOrderId("");
              setDriverLocation(null);
            }
          }
        } catch (err) {
          if (!cancelled) setError(getApiErrorMessage(err, t("tracking.loadFailed")));
        } finally {
          if (!cancelled) setLoadingOrders(false);
        }
        const ok = await ensureLocationPermission();
        if (!ok || cancelled) return;
        Geolocation.getCurrentPosition(
          (info) => {
            if (cancelled) return;
            setMyLocation({
              latitude: info.coords.latitude,
              longitude: info.coords.longitude,
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      }

      loadOrdersAndLocation().catch(() => {});

      return () => {
        cancelled = true;
      };
    }, [selectedOrderId, token, t]),
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
        const latitude = parseCoord(payload?.latitude);
        const longitude = parseCoord(payload?.longitude);
        if (latitude == null || longitude == null) return;
        setDriverLocation({
          latitude,
          longitude,
          updatedAt: payload?.updatedAt || "",
          name: payload?.name || payload?.username || t("tracking.driver"),
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
    }, [selectedOrderId, subscribeSelectedOrder, token, t]),
  );

  useFocusEffect(
    useCallback(() => {
      subscribeSelectedOrder(selectedOrderId);
      return () => {};
    }, [selectedOrderId, subscribeSelectedOrder]),
  );

  const mapRegion = useMemo(() => {
    if (driverLocation) {
      return { ...driverLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 };
    }
    if (myLocation) {
      return { ...myLocation, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    }
    return PHNOM_PENH_REGION;
  }, [driverLocation, myLocation]);

  const renderOrder = ({ item }) => {
    const isActive = String(item.id) === String(selectedOrderId);
    return (
      <Pressable
        onPress={() => {
          setSelectedOrderId(String(item.id));
          setDriverLocation(null);
        }}
        style={[styles.orderChip, isActive && styles.orderChipActive]}
      >
        <Text style={[styles.orderChipTitle, isActive && styles.orderChipTitleActive]}>
          {t("tracking.orderLabel", { id: item.id, name: item.itemName || "Order" })}
        </Text>
        <Text style={[styles.orderChipSub, isActive && styles.orderChipSubActive]}>
          {item.deliveryTime || TRACKABLE_STATUS}
        </Text>
      </Pressable>
    );
  };

  const connectionLabel =
    socketState === "connected" ? t("tracking.live") : socketState;

  return (
    <Screen contentStyle={styles.container}>
      <SectionHeader title={t("tracking.title")} subtitle={t("tracking.subtitle")} />

      {loadingOrders ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : null}

      <Card style={styles.ordersCard}>
        <Text style={styles.cardTitle}>{t("tracking.activeOrders")}</Text>
        {trackableOrders.length === 0 ? (
          <Text style={styles.muted}>{t("tracking.noOrders")}</Text>
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

      <View style={[styles.mapWrap, shadows.card]}>
        <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
          {driverLocation ? (
            <Marker
              coordinate={driverLocation}
              title={driverLocation.name || t("tracking.driver")}
              description={t("tracking.liveLocation")}
            />
          ) : null}
          {myLocation ? (
            <Marker coordinate={myLocation} pinColor={colors.primary} title={t("tracking.you")} />
          ) : null}
        </MapView>
      </View>

      {error ? (
        <Pressable onPress={() => Alert.alert(t("tracking.title"), error)}>
          <Text style={styles.errorText}>{error}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
