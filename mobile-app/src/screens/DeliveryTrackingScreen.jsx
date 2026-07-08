import React, { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { OrderCardSkeleton, EmptyState, ErrorBanner, Screen, SectionHeader, SkeletonList } from "../components/ui";
import { DeliveryCartCard } from "../components/DeliveryCartCard";
import { DeliveryOrderCard } from "../components/DeliveryOrderCard";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useDeliveryCart } from "../context/DeliveryCartContext";
import { useTheme } from "../context/ThemeContext";
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

export default function DeliveryTrackingScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showError, showWarning } = useAlert();
  const { colors, radii, spacing, typography, sizes } = useTheme();
  const { cartOrderIds, clearCart, addToCart, removeFromCart, pruneCartIds } = useDeliveryCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
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
        listContent: { paddingBottom: sizes.tabBarOffset, gap: spacing.md },
      }),
    [colors, radii, sizes.tabBarOffset, spacing, typography],
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

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      const accessToken = typeof token === "string" ? token.trim() : "";
      if (!accessToken) return [];
      if (!silent) setLoading(true);
      try {
        const rows = await listMobileOrders(accessToken);
        const list = Array.isArray(rows) ? rows : [];
        setOrders(list);
        pruneCartIds(list);
        setLoadError("");
        return list;
      } catch {
        const message = t("delivery.ordersLoadFailed");
        setLoadError(message);
        return ordersRef.current;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [pruneCartIds, token, t],
  );

  const handleAddToCart = useCallback(
    (orderId) => {
      const id = String(orderId);
      const order = ordersRef.current.find((row) => String(row.id) === id);
      if (!order || order.status !== SENT_TO_FACTORY) return;
      addToCart(id);
    },
    [addToCart],
  );

  const executeStartDeliveryBatch = useCallback(async () => {
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

      clearCart();
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
        showError(t("delivery.startDeliveryTitle"), t("delivery.startPartialFailed"));
      } else {
        showError(t("delivery.startDeliveryTitle"), t("delivery.startDeliveryFailed"));
      }
    } finally {
      setBatchSubmitting(false);
    }
  }, [
    batchSubmitting,
    canStartDelivery,
    cartOrders,
    clearCart,
    loadOrders,
    navigation,
    token,
    t,
    showError,
  ]);

  const startDeliveryBatch = useCallback(() => {
    if (!canStartDelivery || batchSubmitting) return;
    showWarning(
      t("delivery.startDeliveryConfirmTitle"),
      t("delivery.startDeliveryConfirmMessage", { count: cartOrders.length }),
      {
        actions: [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("delivery.startDelivery"), onPress: () => void executeStartDeliveryBatch() },
        ],
      },
    );
  }, [
    batchSubmitting,
    canStartDelivery,
    cartOrders.length,
    executeStartDeliveryBatch,
    showWarning,
    t,
  ]);

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
        onAddToCart={handleAddToCart}
        onStatusChange={() => {}}
      />
    ),
    [handleAddToCart],
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

  const allPendingInCart =
    pendingOrders.length > 0 && cartOrders.length === pendingOrders.length;

  const listEmpty = loading ? (
    <SkeletonList count={3} ItemComponent={OrderCardSkeleton} itemProps={{ showActions: true }} />
  ) : (
    <EmptyState
      icon="truck-delivery-outline"
      title={allPendingInCart ? t("delivery.allInCart") : t("delivery.noOrders")}
      message={allPendingInCart ? undefined : t("delivery.noPending")}
    />
  );

  const busy = (loading && orders.length === 0) || batchSubmitting;
  const busyMessage = batchSubmitting ? t("delivery.startingDelivery") : undefined;

  return (
    <Screen contentStyle={styles.container} busy={busy} busyMessage={busyMessage}>
      <SectionHeader title={t("delivery.title")} subtitle={t("delivery.subtitle")} />
      {loadError ? (
        <ErrorBanner
          title={t("delivery.ordersAlertTitle")}
          message={loadError}
          onRetry={() => loadOrders()}
        />
      ) : null}
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
