import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, OrderCardSkeleton, SkeletonList } from "../components/ui";
import { DeliveryMapSection } from "../components/DeliveryMapSection";
import {
  DeliveryOrdersBottomSheet,
  getDeliverySheetPeekHeight,
} from "../components/DeliveryOrdersBottomSheet";
import { DeliveryOrderCard } from "../components/DeliveryOrderCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDeliveryLiveTracking } from "../hooks/useDeliveryLiveTracking";
import { listMobileOrders, updateMobileOrderStatus } from "../services/ordersApi";
import {
  ensureDriverLocationReady,
  getCurrentDriverPositionAsync,
} from "../utils/driverLocationProvider";
import {
  getOrderDestination,
  haversineMeters,
  orderHasCustomerCoords,
  pickNearestReadyOrder,
  shouldRefreshByDistance,
} from "../utils/deliveryNavigation";

const NAV_RECALC_THRESHOLD_M = 150;
const DIRECTIONS_ORIGIN_REFRESH_M = 500;
const DIRECTIONS_DEBOUNCE_MS = 400;

const GET_CURRENT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

export default function DeliveryNavigationScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, radii, shadows, spacing, typography } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          overflow: "hidden",
        },
        mapPlaceholder: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceMuted,
          zIndex: 0,
        },
        backButton: {
          position: "absolute",
          left: spacing.lg,
          zIndex: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.pill,
          backgroundColor: colors.surface,
          ...shadows.card,
        },
        backLabel: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        sheetSectionLabel: {
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          fontWeight: "700",
          color: colors.textSecondary,
        },
        list: {
          flex: 1,
        },
        sheetListContent: {
          paddingBottom: spacing.xl,
          gap: spacing.md,
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: typography.body,
        },
      }),
    [colors, radii, shadows, spacing, typography],
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [activeNavOrderId, setActiveNavOrderId] = useState(null);
  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const [directionsError, setDirectionsError] = useState("");
  const [ordersSheetExpanded, setOrdersSheetExpanded] = useState(false);
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });
  const sheetPeekHeight = useMemo(
    () => getDeliverySheetPeekHeight(Dimensions.get("window").height),
    [],
  );
  const [mapReady, setMapReady] = useState(false);

  const lastNavRecalcLat = useRef(null);
  const lastNavRecalcLng = useRef(null);
  const ordersRef = useRef(orders);
  const directionsOriginRef = useRef(null);
  const directionsDebounceRef = useRef(null);

  directionsOriginRef.current = directionsOrigin;
  ordersRef.current = orders;

  const readyForDeliveryOrders = useMemo(
    () => orders.filter((order) => order.status === "Ready_For_Delivery"),
    [orders],
  );

  const listOrders = useMemo(
    () => readyForDeliveryOrders.map((order) => ({ ...order, listMode: "active" })),
    [readyForDeliveryOrders],
  );

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
    [recomputeActiveNavOrder],
  );

  const { trackingStatus, driverLocation, driverLocationRef, setDriverLocationImmediate } =
    useDeliveryLiveTracking({
      token,
      shouldTrack: isFocused,
      mapVisible: true,
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

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) return [];
      if (!silent) setLoading(true);
      try {
        const rows = await listMobileOrders(accessToken);
        const list = Array.isArray(rows) ? rows : [];
        setOrders(list);
        return list;
      } catch {
        if (!silent) Alert.alert(t("delivery.ordersAlertTitle"), t("delivery.ordersLoadFailed"));
        return ordersRef.current;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, t],
  );

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

          const stillActive = rows.filter((row) => row.status === "Ready_For_Delivery");
          if (stillActive.length === 0) {
            navigation.goBack();
          }
        }
      } catch {
        setOrders((prev) =>
          prev.map((row) =>
            String(row.id) === String(orderId) && orderBefore
              ? { ...row, status: orderBefore.status }
              : row,
          ),
        );
        Alert.alert(t("delivery.statusAlertTitle"), t("delivery.statusUpdateFailed"));
        if (status === "Recieve_By_Customer" && orderBefore?.status === "Ready_For_Delivery") {
          const loc = driverLocationRef.current;
          if (loc) recomputeActiveNavOrder(ordersRef.current, loc);
        }
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [
      loadOrders,
      navigation,
      recomputeActiveNavOrder,
      refreshDriverLocationOnce,
      driverLocationRef,
      token,
      t,
    ],
  );

  useEffect(() => {
    if (!isFocused) {
      setMapReady(false);
      return undefined;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      setMapReady(true);
    });
    return () => task.cancel();
  }, [isFocused]);

  useFocusEffect(
    useCallback(() => {
      loadOrders().then((rows) => {
        const active = rows.filter((row) => row.status === "Ready_For_Delivery");
        if (active.length === 0) {
          navigation.goBack();
          return;
        }
        const loc = driverLocationRef.current;
        if (loc) {
          recomputeActiveNavOrder(rows, loc);
        } else {
          void refreshDriverLocationOnce().then((fresh) => {
            if (fresh) recomputeActiveNavOrder(rows, fresh);
          });
        }
      });
    }, [loadOrders, navigation, recomputeActiveNavOrder, refreshDriverLocationOnce, driverLocationRef]),
  );

  useEffect(() => {
    const activeStillReady = readyForDeliveryOrders.some(
      (order) => String(order.id) === String(activeNavOrderId),
    );
    if ((!activeNavOrderId || !activeStillReady) && driverLocation) {
      recomputeActiveNavOrder(orders, driverLocation);
    }
  }, [orders, readyForDeliveryOrders, activeNavOrderId, driverLocation, recomputeActiveNavOrder]);

  const handleDirectionsError = useCallback((message) => {
    setDirectionsError(typeof message === "string" ? message : "");
  }, []);

  const keyExtractor = useCallback((item) => `active-${item.id}`, []);

  const renderOrderItem = useCallback(
    ({ item }) => (
      <DeliveryOrderCard
        item={item}
        mode="active"
        isActiveNav={String(item.id) === String(activeNavOrderId)}
        submittingOrderId={submittingOrderId}
        onAddToCart={() => {}}
        onStatusChange={changeOrderStatus}
      />
    ),
    [activeNavOrderId, submittingOrderId, changeOrderStatus],
  );

  const sheetPeekTitle = useMemo(() => {
    if (activeNavOrder) {
      return `Next · #${activeNavOrder.id} ${activeNavOrder.customerName || ""}`.trim();
    }
    return `${readyForDeliveryOrders.length} active deliver${readyForDeliveryOrders.length === 1 ? "y" : "ies"}`;
  }, [activeNavOrder, readyForDeliveryOrders.length]);

  const sheetPeekSubtitle = useMemo(() => {
    if (activeNavOrder) {
      return `${readyForDeliveryOrders.length} stop${readyForDeliveryOrders.length === 1 ? "" : "s"} remaining`;
    }
    const label =
      trackingStatus === "active"
        ? t("delivery.liveTrackingOn")
        : String(trackingStatus);
    return label;
  }, [activeNavOrder, readyForDeliveryOrders.length, trackingStatus, t]);

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setMapLayout({ width, height });
        }
      }}
    >
      {mapReady && mapLayout.height > 0 ? (
        <DeliveryMapSection
          fullScreen
          mapWidth={mapLayout.width}
          mapHeight={mapLayout.height}
          bottomInset={sheetPeekHeight}
          driverLocation={driverLocation}
          activeNavOrder={activeNavOrder}
          activeNavOrderId={activeNavOrderId}
          activeDestination={activeDestination}
          directionsOrigin={directionsOrigin}
          directionsError={directionsError}
          readyForDeliveryOrders={readyForDeliveryOrders}
          readyOrdersMissingCoordsCount={readyOrdersMissingCoordsCount}
          onDirectionsError={handleDirectionsError}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator color={colors.textPrimary} size="large" />
        </View>
      )}

      <Pressable
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back to delivery list"
      >
        <AppIcon name="arrow-left" size={22} color={colors.textPrimary} />
        <Text style={styles.backLabel}>{t("delivery.back")}</Text>
      </Pressable>

      <DeliveryOrdersBottomSheet
        expanded={ordersSheetExpanded}
        onExpandedChange={setOrdersSheetExpanded}
        peekTitle={sheetPeekTitle}
        peekSubtitle={sheetPeekSubtitle}
      >
        <Text style={styles.sheetSectionLabel}>{t("delivery.activeDeliveries")}</Text>
        {loading ? (
          <SkeletonList
            count={3}
            ItemComponent={OrderCardSkeleton}
            itemProps={{ showActions: true }}
          />
        ) : (
          <FlatList
            style={styles.list}
            data={listOrders}
            keyExtractor={keyExtractor}
            renderItem={renderOrderItem}
            extraData={{ activeNavOrderId, submittingOrderId }}
            contentContainerStyle={styles.sheetListContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t("delivery.noActiveDeliveries")}</Text>
            }
            scrollEnabled={ordersSheetExpanded}
            showsVerticalScrollIndicator={ordersSheetExpanded}
          />
        )}
      </DeliveryOrdersBottomSheet>
    </View>
  );
}
