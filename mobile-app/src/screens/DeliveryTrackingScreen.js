import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  PermissionsAndroid,
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

async function ensureFineLocationPermission() {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location permission",
        message: "Allow location so dispatch can see your position while you are on duty.",
        buttonPositive: "Allow",
        buttonNegative: "Not now",
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  if (Platform.OS === "ios") {
    Geolocation.setRNConfiguration({
      authorizationLevel: "whenInUse",
      skipPermissionRequests: false,
    });
  }
  return true;
}

export default function DeliveryTrackingScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const lastEmitAt = useRef(0);
  const lastLat = useRef(null);
  const lastLng = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

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

    async function startTracking() {
      if (!shouldTrack) return;
      const ok = await ensureFineLocationPermission();
      if (cancelled) return;
      if (!ok) {
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
        Alert.alert("Configuration", "API base URL is missing.");
        return;
      }
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) {
        Alert.alert("Session", "Sign in again to share your location.");
        return;
      }

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

      watchIdRef.current = Geolocation.watchPosition(
        (info) => {
          if (!socketRef.current?.connected) return;
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
          socketRef.current.emit("delivery:location", {
            latitude,
            longitude,
            accuracy: accuracy != null ? Number(accuracy) : undefined,
          });
        },
        () => {},
        Platform.OS === "android"
          ? {
              enableHighAccuracy: true,
              distanceFilter: 20,
              interval: 10000,
              fastestInterval: 5000,
            }
          : { enableHighAccuracy: true, distanceFilter: 20 },
      );
    }

    void startTracking();

    return () => {
      cancelled = true;
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
        <Text style={styles.orderLine}>
          Address: {item.orderAddressName || item.customerAddressName || "-"}
        </Text>
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
