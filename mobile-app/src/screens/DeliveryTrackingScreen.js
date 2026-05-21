import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { OrderCardSkeleton, Screen, SectionHeader, SkeletonList } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { DeliveryCartCard } from "../components/DeliveryCartCard";
import { DeliveryOrderCard } from "../components/DeliveryOrderCard";
import { listMobileOrders, updateMobileOrderStatus } from "../services/ordersApi";
import {
  ensureDriverLocationReady,
  getCurrentDriverPositionAsync,
} from "../utils/driverLocationProvider";

const SENT_TO_FACTORY = "Sent_To_Factory";

const GET_CURRENT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

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
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [orders, setOrders] = useState([]);
  const [cartOrderIds, setCartOrderIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const ordersRef = useRef(orders);

  ordersRef.current = orders;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, paddingBottom: spacing.sm },
        continueCard: {
          marginBottom: spacing.md,
          padding: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.primary,
        },
        continueTitle: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.onPrimary,
        },
        continueAction: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          fontWeight: "600",
          color: colors.onPrimary,
          opacity: 0.85,
        },
        sectionLabel: {
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          fontWeight: "700",
          color: colors.textSecondary,
        },
        list: { flex: 1 },
        listContent: { paddingBottom: spacing.xl, gap: spacing.md },
        emptyText: {
          marginTop: spacing.lg,
          color: colors.textSecondary,
          fontSize: typography.body,
        },
      }),
    [colors, radii, spacing, typography],
  );

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
    () => availablePending.map((order) => ({ ...order, listMode: "pending" })),
    [availablePending],
  );

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
        if (!silent) {
          Alert.alert(t("delivery.ordersAlertTitle"), t("delivery.ordersLoadFailed"));
        }
        return ordersRef.current;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyOrdersAndPruneCart, token, t],
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
      await loadOrders({ silent: true });
      await ensureDriverLocationReady();
      try {
        await getCurrentDriverPositionAsync(GET_CURRENT_OPTIONS);
      } catch {
        // Navigation screen will retry GPS
      }

      navigation.navigate("DeliveryNavigation");
    } catch {
      await loadOrders({ silent: true });
      if (startedIds.length > 0) {
        setCartOrderIds(idsToStart.filter((id) => !startedIds.includes(id)));
        Alert.alert(t("delivery.startDeliveryTitle"), t("delivery.startPartialFailed"));
      } else {
        Alert.alert(t("delivery.startDeliveryTitle"), t("delivery.startDeliveryFailed"));
      }
    } finally {
      setBatchSubmitting(false);
    }
  }, [batchSubmitting, canStartDelivery, cartOrders, loadOrders, navigation, token, t]);

  useFocusEffect(
    useCallback(() => {
      loadOrders().catch(() => {});
    }, [loadOrders]),
  );

  const keyExtractor = useCallback((item) => `pending-${item.id}`, []);

  const renderOrderItem = useCallback(
    ({ item }) => (
      <DeliveryOrderCard
        item={item}
        mode="pending"
        isActiveNav={false}
        submittingOrderId={null}
        onAddToCart={addToCart}
        onStatusChange={() => {}}
      />
    ),
    [addToCart],
  );

  const continueKey =
    readyForDeliveryOrders.length === 1
      ? "delivery.continueInProgress"
      : "delivery.continueInProgress_plural";

  const listHeader = useMemo(
    () => (
      <View>
        {readyForDeliveryOrders.length > 0 ? (
          <Pressable
            style={styles.continueCard}
            onPress={() => navigation.navigate("DeliveryNavigation")}
          >
            <Text style={styles.continueTitle}>
              {t(continueKey, { count: readyForDeliveryOrders.length })}
            </Text>
            <Text style={styles.continueAction}>{t("delivery.continueAction")}</Text>
          </Pressable>
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
          <Text style={styles.sectionLabel}>{t("delivery.pendingOrders")}</Text>
        ) : null}
      </View>
    ),
    [
      readyForDeliveryOrders.length,
      navigation,
      cartOrders,
      pendingOrders.length,
      canStartDelivery,
      batchSubmitting,
      startDeliveryBatch,
      removeFromCart,
      availablePending.length,
      styles,
      t,
      continueKey,
    ],
  );

  const listEmpty = loading ? (
    <SkeletonList count={3} ItemComponent={OrderCardSkeleton} itemProps={{ showActions: true }} />
  ) : (
    <Text style={styles.emptyText}>
      {pendingOrders.length > 0 && cartOrders.length === pendingOrders.length
        ? t("delivery.allInCart")
        : t("delivery.noOrders")}
    </Text>
  );

  return (
    <Screen contentStyle={styles.container} accessibilityState={loading ? { busy: true } : undefined}>
      <SectionHeader title={t("delivery.title")} subtitle={t("delivery.subtitle")} />
      <FlatList
        style={styles.list}
        data={loading ? [] : listOrders}
        keyExtractor={keyExtractor}
        renderItem={renderOrderItem}
        extraData={cartOrderIds}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
      />
    </Screen>
  );
}
