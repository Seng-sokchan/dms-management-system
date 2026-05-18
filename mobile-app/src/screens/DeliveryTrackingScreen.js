import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import Geolocation from "@react-native-community/geolocation";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";
import { getSocketBaseUrl } from "../services/socketUrl";
import { listMobileOrders, updateMobileOrderStatus } from "../services/ordersApi";
import { ensureLocationPermission } from "../utils/locationPermission";
import { colors, radii, spacing, typography } from "../theme";

const EMIT_MIN_INTERVAL_MS = 8000;
const MOVE_EMIT_THRESHOLD_M = 35;

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

export default function DeliveryTrackingScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("idle");
  const lastEmitAt = useRef(0);
  const lastLat = useRef(null);
  const lastLng = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const pendingLocationRef = useRef(null);
  const locationErrorShownRef = useRef(false);

  const readyForDeliveryOrders = useMemo(
    () => orders.filter((order) => order.status === "Ready_For_Delivery"),
    [orders],
  );
  const shouldTrack = isFocused && readyForDeliveryOrders.length > 0;

  const loadOrders = useCallback(async () => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    setLoading(true);
    try {
      const rows = await listMobileOrders(accessToken);
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (error) {
      Alert.alert("Orders", "Could not load assigned orders.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function changeOrderStatus(orderId, status) {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    setSubmittingOrderId(orderId);
    try {
      await updateMobileOrderStatus(accessToken, orderId, status);
      await loadOrders();
    } catch (error) {
      Alert.alert("Status", "Could not update order status.");
    } finally {
      setSubmittingOrderId(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

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
          ? "Location permission is denied. Allow location in Settings."
          : code === 2
            ? "GPS is unavailable. Turn on Location (GPS) on your phone."
            : "Could not read GPS. Move outdoors or wait a moment and try again.";
      Alert.alert("Location", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Open settings", onPress: () => Linking.openSettings() },
      ]);
    }

    async function startTracking() {
      if (!shouldTrack) {
        setTrackingStatus("idle");
        return;
      }

      setTrackingStatus("starting");
      locationErrorShownRef.current = false;

      if (Platform.OS === "ios") {
        Geolocation.setRNConfiguration({
          authorizationLevel: "whenInUse",
          skipPermissionRequests: false,
        });
      }

      const ok = await ensureLocationPermission();
      if (cancelled) return;
      if (!ok) {
        setTrackingStatus("permission_denied");
        Alert.alert(
          "Location off",
          "Turn on location permission in system settings to share your position.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const baseUrl = getSocketBaseUrl();
      if (!baseUrl) {
        setTrackingStatus("config_error");
        Alert.alert("Configuration", "API base URL is missing.");
        return;
      }
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) {
        setTrackingStatus("session_error");
        Alert.alert("Session", "Sign in again to share your location.");
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
        Alert.alert("Connection", err?.message || "Could not connect to tracking server.");
      });

      watchIdRef.current = Geolocation.watchPosition(
        handlePosition,
        handleLocationError,
        Platform.OS === "android" ? ANDROID_WATCH_OPTIONS : IOS_WATCH_OPTIONS,
      );
    }

    void startTracking();

    return () => {
      cancelled = true;
      setTrackingStatus("idle");
      pendingLocationRef.current = null;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shouldTrack, token]);

  function renderOrderItem({ item }) {
    const isSentToFactory = item.status === "Sent_To_Factory";
    const isReady = item.status === "Ready_For_Delivery";
    return (
      <Card style={styles.orderCard}>
        <Text style={styles.orderTitle}>#{item.id}</Text>
        <Text style={styles.orderLine}>Customer: {item.customerName || "-"}</Text>
        <Text style={styles.orderStatus}>Status: {item.status}</Text>
        <View style={styles.actionsRow}>
          {isSentToFactory ? (
            <TouchableOpacity
              style={styles.actionButton}
              disabled={submittingOrderId === item.id}
              onPress={() => void changeOrderStatus(item.id, "Ready_For_Delivery")}
            >
              <Text style={styles.actionText}>Start Delivery</Text>
            </TouchableOpacity>
          ) : null}
          {isReady ? (
            <TouchableOpacity
              style={styles.actionButton}
              disabled={submittingOrderId === item.id}
              onPress={() => void changeOrderStatus(item.id, "Recieve_By_Customer")}
            >
              <Text style={styles.actionText}>Delivered</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Delivery Orders</Text>
        <Text style={styles.lead}>Track assigned orders and update status while delivering.</Text>
        {shouldTrack ? (
          <Text style={styles.trackingStatus}>
            Live tracking: {trackingStatus === "active" ? "sharing location" : trackingStatus}
          </Text>
        ) : null}
        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? null : <Text style={styles.emptyText}>No assigned orders found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  lead: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  trackingStatus: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  card: {
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  loader: {
    marginTop: spacing.md,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  orderCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  orderTitle: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  orderLine: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  orderStatus: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.onPrimary || "#ffffff",
    fontWeight: "700",
  },
  emptyText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  cardText: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
