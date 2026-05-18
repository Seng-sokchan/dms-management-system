import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { DeliveryCartCard } from "../components/DeliveryCartCard";
import { DeliveryMapSection } from "../components/DeliveryMapSection";
import { DeliveryOrderCard } from "../components/DeliveryOrderCard";
import { useDeliveryLiveTracking } from "../hooks/useDeliveryLiveTracking";
import { listMobileOrders, updateMobileOrderStatus } from "../services/ordersApi";
import {
  ensureDriverLocationReady,
  getCurrentDriverPositionAsync,
  isUsingFakeDriverLocation,
} from "../utils/driverLocationProvider";
import {
  getOrderDestination,
  haversineMeters,
  orderHasCustomerCoords,
  pickNearestReadyOrder,
  shouldRefreshByDistance,
} from "../utils/deliveryNavigation";
import { colors, spacing, typography } from "../theme";

const NAV_RECALC_THRESHOLD_M = 150;
const DIRECTIONS_ORIGIN_REFRESH_M = 500;
const DIRECTIONS_DEBOUNCE_MS = 400;
const SENT_TO_FACTORY = "Sent_To_Factory";

const GET_CURRENT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

const useFakeLocation = isUsingFakeDriverLocation();

function pruneCartIds(cartIds, orderList) {
  const pendingIds = new Set(
    orderList
      .filter((order) => order.status === SENT_TO_FACTORY)
      .map((order) => String(order.id)),
  );
  return cartIds.filter((id) => pendingIds.has(String(id)));
}

export default function DeliveryTrackingScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState([]);
  const [cartOrderIds, setCartOrderIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [activeNavOrderId, setActiveNavOrderId] = useState(null);
  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const [directionsError, setDirectionsError] = useState("");

  const lastNavRecalcLat = useRef(null);
  const lastNavRecalcLng = useRef(null);
  const ordersRef = useRef(orders);
  const directionsOriginRef = useRef(null);
  const directionsDebounceRef = useRef(null);

  directionsOriginRef.current = directionsOrigin;
  ordersRef.current = orders;

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === SENT_TO_FACTORY),
    [orders],
  );

  const cartOrderIdSet = useMemo(() => new Set(cartOrderIds.map(String)), [cartOrderIds]);

  const cartOrders = useMemo(
    () => pendingOrders.filter((order) => cartOrderIdSet.has(String(order.id))),
    [pendingOrders, cartOrderIdSet],
  );

  const availablePending = useMemo(
    () => pendingOrders.filter((order) => !cartOrderIdSet.has(String(order.id))),
    [pendingOrders, cartOrderIdSet],
  );

  const readyForDeliveryOrders = useMemo(
    () => orders.filter((order) => order.status === "Ready_For_Delivery"),
    [orders],
  );

  const canStartDelivery =
    pendingOrders.length > 0 && cartOrders.length === pendingOrders.length;

  const listOrders = useMemo(
    () => [
      ...availablePending.map((order) => ({ ...order, listMode: "pending" })),
      ...readyForDeliveryOrders.map((order) => ({ ...order, listMode: "active" })),
    ],
    [availablePending, readyForDeliveryOrders],
  );

  const mapVisible = readyForDeliveryOrders.length > 0;
  const shouldTrack = isFocused && mapVisible;

  const activeNavOrder = useMemo(
    () => orders.find((order) => String(order.id) === String(activeNavOrderId)) || null,
    [orders, activeNavOrderId],
  );

  const activeDestination = useMemo(
    () => (activeNavOrder ? getOrderDestination(activeNavOrder) : null),
    [activeNavOrder],
  );

  const readyOrdersMissingCoordsCount = useMemo(
    () => readyForDeliveryOrders.filter((order) => !orderHasCustomerCoords(order)).length,
    [readyForDeliveryOrders],
  );

  const recomputeActiveNavOrder = useCallback((orderList, location) => {
    const rows = orderList ?? ordersRef.current;
    const loc = location;
    if (!loc) return;
    const nearest = pickNearestReadyOrder(rows, loc.latitude, loc.longitude);
    setActiveNavOrderId(nearest ? String(nearest.order.id) : null);
    if (nearest) {
      lastNavRecalcLat.current = loc.latitude;
      lastNavRecalcLng.current = loc.longitude;
    }
  }, []);

  const handlePositionForNav = useCallback(
    (latitude, longitude) => {
      if (!mapVisible) return;
      const prevLat = lastNavRecalcLat.current;
      const prevLng = lastNavRecalcLng.current;
      if (prevLat != null && prevLng != null) {
        const moved = haversineMeters(prevLat, prevLng, latitude, longitude);
        if (moved < NAV_RECALC_THRESHOLD_M) return;
      }
      lastNavRecalcLat.current = latitude;
      lastNavRecalcLng.current = longitude;
      recomputeActiveNavOrder(ordersRef.current, { latitude, longitude });
    },
    [mapVisible, recomputeActiveNavOrder],
  );

  const { trackingStatus, driverLocation, driverLocationRef, setDriverLocationImmediate } =
    useDeliveryLiveTracking({
      token,
      shouldTrack,
      mapVisible,
      onPositionForNav: handlePositionForNav,
    });

  useEffect(() => {
    setDirectionsError("");
    if (!activeNavOrderId || !activeDestination) {
      if (directionsDebounceRef.current) clearTimeout(directionsDebounceRef.current);
      directionsDebounceRef.current = null;
      setDirectionsOrigin(null);
      return;
    }
    const loc = driverLocationRef.current ?? driverLocation;
    if (loc) setDirectionsOrigin(loc);
  }, [activeNavOrderId, activeDestination, driverLocation, driverLocationRef]);

  useEffect(() => {
    if (!driverLocation || !activeDestination || !activeNavOrderId) return undefined;

    const prev = directionsOriginRef.current;
    if (!prev) return undefined;
    if (!shouldRefreshByDistance(prev, driverLocation, DIRECTIONS_ORIGIN_REFRESH_M)) {
      return undefined;
    }

    if (directionsDebounceRef.current) clearTimeout(directionsDebounceRef.current);
    directionsDebounceRef.current = setTimeout(() => {
      directionsDebounceRef.current = null;
      setDirectionsOrigin(driverLocation);
    }, DIRECTIONS_DEBOUNCE_MS);

    return () => {
      if (directionsDebounceRef.current) {
        clearTimeout(directionsDebounceRef.current);
        directionsDebounceRef.current = null;
      }
    };
  }, [driverLocation, activeNavOrderId, activeDestination]);

  const refreshDriverLocationOnce = useCallback(async () => {
    try {
      const ok = await ensureDriverLocationReady();
      if (!ok) return null;
      const info = await getCurrentDriverPositionAsync(GET_CURRENT_OPTIONS);
      const { latitude, longitude } = info.coords;
      const loc = { latitude, longitude };
      setDriverLocationImmediate(loc);
      return loc;
    } catch {
      return driverLocationRef.current;
    }
  }, [driverLocationRef, setDriverLocationImmediate]);

  const applyOrdersAndPruneCart = useCallback((list) => {
    setOrders(list);
    setCartOrderIds((prev) => pruneCartIds(prev, list));
    return list;
  }, []);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) return [];
      if (!silent) setLoading(true);
      try {
        const rows = await listMobileOrders(accessToken);
        const list = Array.isArray(rows) ? rows : [];
        return applyOrdersAndPruneCart(list);
      } catch {
        if (!silent) Alert.alert("Orders", "Could not load assigned orders.");
        return ordersRef.current;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyOrdersAndPruneCart, token],
  );

  const addToCart = useCallback((orderId) => {
    const id = String(orderId);
    const order = ordersRef.current.find((row) => String(row.id) === id);
    if (!order || order.status !== SENT_TO_FACTORY) return;
    setCartOrderIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFromCart = useCallback((orderId) => {
    const id = String(orderId);
    setCartOrderIds((prev) => prev.filter((entry) => String(entry) !== id));
  }, []);

  const changeOrderStatus = useCallback(
    async (orderId, status) => {
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) return;

      const orderBefore = ordersRef.current.find((row) => String(row.id) === String(orderId));

      if (status === "Recieve_By_Customer") {
        setActiveNavOrderId(null);
      }

      setOrders((prev) =>
        prev.map((row) => (String(row.id) === String(orderId) ? { ...row, status } : row)),
      );

      setSubmittingOrderId(orderId);
      try {
        await updateMobileOrderStatus(accessToken, orderId, status);
        const rows = await loadOrders({ silent: true });

        if (status === "Recieve_By_Customer") {
          const loc = driverLocationRef.current || (await refreshDriverLocationOnce());
          if (loc) {
            recomputeActiveNavOrder(rows, loc);
          } else {
            setActiveNavOrderId(null);
          }
        }
      } catch {
        setOrders((prev) =>
          prev.map((row) =>
            String(row.id) === String(orderId) && orderBefore ? { ...row, status: orderBefore.status } : row,
          ),
        );
        Alert.alert("Status", "Could not update order status.");
        if (status === "Recieve_By_Customer" && orderBefore?.status === "Ready_For_Delivery") {
          const loc = driverLocationRef.current;
          if (loc) recomputeActiveNavOrder(ordersRef.current, loc);
        }
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [loadOrders, recomputeActiveNavOrder, refreshDriverLocationOnce, driverLocationRef],
  );

  const startDeliveryBatch = useCallback(async () => {
    if (!canStartDelivery || batchSubmitting) return;

    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;

    const idsToStart = cartOrders.map((order) => String(order.id));
    if (idsToStart.length === 0) return;

    setBatchSubmitting(true);
    const startedIds = [];

    try {
      for (const orderId of idsToStart) {
        await updateMobileOrderStatus(accessToken, orderId, "Ready_For_Delivery");
        startedIds.push(orderId);
      }

      setCartOrderIds([]);
      const rows = await loadOrders({ silent: true });
      const loc = (await refreshDriverLocationOnce()) || driverLocationRef.current;
      if (loc) {
        recomputeActiveNavOrder(rows, loc);
      }

      const missingCoords = rows.filter(
        (row) =>
          startedIds.includes(String(row.id)) &&
          row.status === "Ready_For_Delivery" &&
          !orderHasCustomerCoords(row),
      );
      if (missingCoords.length > 0) {
        Alert.alert(
          "No map location",
          `${missingCoords.length} order(s) have no customer latitude/longitude. Add coordinates in admin to show directions.`,
        );
      }
    } catch {
      await loadOrders({ silent: true });
      if (startedIds.length > 0) {
        setCartOrderIds(idsToStart.filter((id) => !startedIds.includes(id)));
        Alert.alert(
          "Start delivery",
          "Some orders could not be started. Remaining orders are still in your cart.",
        );
      } else {
        Alert.alert("Start delivery", "Could not start delivery for these orders.");
      }
    } finally {
      setBatchSubmitting(false);
    }
  }, [
    batchSubmitting,
    canStartDelivery,
    cartOrders,
    driverLocationRef,
    loadOrders,
    recomputeActiveNavOrder,
    refreshDriverLocationOnce,
    token,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadOrders().catch(() => {});
    }, [loadOrders]),
  );

  useEffect(() => {
    if (!mapVisible) {
      setActiveNavOrderId(null);
      return;
    }
    const activeStillReady = readyForDeliveryOrders.some(
      (order) => String(order.id) === String(activeNavOrderId),
    );
    if ((!activeNavOrderId || !activeStillReady) && driverLocation) {
      recomputeActiveNavOrder(orders, driverLocation);
    }
  }, [
    mapVisible,
    orders,
    readyForDeliveryOrders,
    activeNavOrderId,
    driverLocation,
    recomputeActiveNavOrder,
  ]);

  const handleDirectionsError = useCallback((message) => {
    setDirectionsError(typeof message === "string" ? message : "");
  }, []);

  const keyExtractor = useCallback((item) => `${item.listMode}-${item.id}`, []);

  const renderOrderItem = useCallback(
    ({ item, index }) => {
      const showActiveHeader =
        item.listMode === "active" &&
        index === availablePending.length &&
        availablePending.length > 0;

      return (
        <View>
          {showActiveHeader ? <Text style={styles.sectionLabel}>Active deliveries</Text> : null}
          <DeliveryOrderCard
            item={item}
            mode={item.listMode}
            isActiveNav={item.listMode === "active" && String(item.id) === String(activeNavOrderId)}
            submittingOrderId={submittingOrderId}
            onAddToCart={addToCart}
            onStatusChange={changeOrderStatus}
          />
        </View>
      );
    },
    [activeNavOrderId, availablePending.length, submittingOrderId, addToCart, changeOrderStatus],
  );

  const listExtraData = useMemo(
    () => ({ activeNavOrderId, submittingOrderId, cartOrderIds }),
    [activeNavOrderId, submittingOrderId, cartOrderIds],
  );

  const listHeader = useMemo(
    () => (
      <View>
        {mapVisible ? (
          <DeliveryMapSection
            driverLocation={driverLocation}
            activeNavOrder={activeNavOrder}
            activeNavOrderId={activeNavOrderId}
            activeDestination={activeDestination}
            directionsOrigin={directionsOrigin}
            directionsError={directionsError}
            readyForDeliveryOrders={readyForDeliveryOrders}
            readyOrdersMissingCoordsCount={readyOrdersMissingCoordsCount}
            useFakeLocation={useFakeLocation}
            onDirectionsError={handleDirectionsError}
          />
        ) : null}
        {cartOrders.length > 0 ? (
          <DeliveryCartCard
            orders={cartOrders}
            totalPendingCount={pendingOrders.length}
            canStartDelivery={canStartDelivery}
            submitting={batchSubmitting}
            onStartDelivery={startDeliveryBatch}
            onRemoveFromCart={removeFromCart}
          />
        ) : null}
        {availablePending.length > 0 ? (
          <Text style={styles.sectionLabel}>Pending orders</Text>
        ) : null}
        {readyForDeliveryOrders.length > 0 &&
        availablePending.length === 0 &&
        cartOrders.length === 0 ? (
          <Text style={styles.sectionLabel}>Active deliveries</Text>
        ) : null}
      </View>
    ),
    [
      mapVisible,
      driverLocation,
      activeNavOrder,
      activeNavOrderId,
      activeDestination,
      directionsOrigin,
      directionsError,
      readyForDeliveryOrders,
      readyOrdersMissingCoordsCount,
      handleDirectionsError,
      cartOrders,
      pendingOrders.length,
      canStartDelivery,
      batchSubmitting,
      startDeliveryBatch,
      removeFromCart,
      availablePending.length,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Delivery Orders</Text>
        <Text style={styles.lead}>
          Add orders to your cart, then start delivery when all are ready.
        </Text>
        {shouldTrack ? (
          <Text style={styles.trackingStatus}>
            Live tracking:{" "}
            {trackingStatus === "active"
              ? useFakeLocation
                ? "sharing test location"
                : "sharing location"
              : trackingStatus === "test_location"
                ? "test location (no GPS)"
                : trackingStatus}
          </Text>
        ) : null}
        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        <FlatList
          style={styles.list}
          data={listOrders}
          keyExtractor={keyExtractor}
          renderItem={renderOrderItem}
          extraData={listExtraData}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            loading ? null : (
              <Text style={styles.emptyText}>
                {pendingOrders.length > 0 && cartOrders.length === pendingOrders.length
                  ? "All pending orders are in your cart. Tap Start Delivery above."
                  : "No orders to show."}
              </Text>
            )
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
  loader: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
});
