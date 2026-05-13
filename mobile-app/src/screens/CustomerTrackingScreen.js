import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { getSocketBaseUrl } from "../services/socketUrl";
import { colors, radii, spacing, typography } from "../theme";

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

async function requestLocationPermission() {
  if (Platform.OS !== "android") return true;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: "Location permission",
    message: "Allow location permission to show your position on tracking map.",
    buttonPositive: "Allow",
    buttonNegative: "Not now",
  });
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function CustomerTrackingScreen() {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [socketState, setSocketState] = useState("idle");
  const [error, setError] = useState("");

  const trackableOrders = useMemo(
    () => orders.filter((row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId),
    [orders],
  );

  const subscribeSelectedOrder = useCallback((orderId) => {
    if (!orderId || !socketRef.current?.connected) return;
    socketRef.current.emit("subscribe:customer-order-tracking", { orderId }, (ack) => {
      if (!ack?.ok) {
        setDriverLocation(null);
        setError(ack?.error || "Cannot subscribe to this order");
        return;
      }
      setError("");
    });
  }, []);

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
            const firstId = rows.find((row) => row?.status === TRACKABLE_STATUS && row?.deliveryAgentId)?.id;
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
          if (!cancelled) setError(getApiErrorMessage(err, "Failed to load orders"));
        } finally {
          if (!cancelled) setLoadingOrders(false);
        }
        const ok = await requestLocationPermission();
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
    }, [selectedOrderId, token]),
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
          name: payload?.name || payload?.username || "Driver",
        });
      });
      socket.on("connect_error", (err) => {
        setSocketState("error");
        setError(err?.message || "Socket connection failed");
      });
      return () => {
        socketRef.current = null;
        socket.removeAllListeners();
        socket.disconnect();
      };
    }, [selectedOrderId, subscribeSelectedOrder, token]),
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
          #{item.id} - {item.itemName || "Order"}
        </Text>
        <Text style={styles.orderChipSub}>{item.deliveryTime || TRACKABLE_STATUS}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Track delivery</Text>
        <Text style={styles.lead}>Live location is available when order status is Ready_For_Delivery.</Text>

        {loadingOrders ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Trackable orders</Text>
          {trackableOrders.length === 0 ? (
            <Text style={styles.muted}>No orders are currently ready for delivery.</Text>
          ) : (
            <FlatList
              horizontal
              data={trackableOrders}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderOrder}
              showsHorizontalScrollIndicator={false}
            />
          )}
          <Text style={styles.muted}>Socket: {socketState}</Text>
        </Card>

        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
            {driverLocation ? (
              <Marker coordinate={driverLocation} title={driverLocation.name || "Driver"} description="Live location" />
            ) : null}
            {myLocation ? <Marker coordinate={myLocation} pinColor="#ef4444" title="You" /> : null}
          </MapView>
        </View>

        {error ? (
          <Pressable onPress={() => Alert.alert("Tracking", error)}>
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: typography.h2, fontWeight: "800", color: colors.textPrimary },
  lead: { marginTop: spacing.sm, fontSize: typography.body, color: colors.textSecondary },
  loadingWrap: { marginTop: spacing.md, alignItems: "center" },
  card: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.lg },
  cardTitle: { color: colors.textPrimary, fontWeight: "700", marginBottom: spacing.sm },
  muted: { color: colors.textMuted, marginTop: spacing.sm, fontSize: typography.caption },
  orderChip: {
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  orderChipActive: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  orderChipTitle: { color: colors.textPrimary, fontWeight: "600", fontSize: typography.bodySmall },
  orderChipTitleActive: { color: colors.primary },
  orderChipSub: { color: colors.textMuted, marginTop: 2, fontSize: typography.caption },
  mapWrap: {
    flex: 1,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  errorText: { color: colors.danger, marginTop: spacing.sm, fontSize: typography.caption },
});
