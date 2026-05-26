import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AppIcon, OrderCardSkeleton, Screen, SectionHeader, SkeletonList } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useDeliveryCart } from "../context/DeliveryCartContext";
import { useTheme } from "../context/ThemeContext";
import { DeliveryOrderCard } from "../components/DeliveryOrderCard";
import { listMobileOrders } from "../services/ordersApi";

const SENT_TO_FACTORY = "Sent_To_Factory";

export default function DeliveryTrackingScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography, sizes } = useTheme();
  const { cartOrderIds, cartCount, addToCart, pruneCartIds } = useDeliveryCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const ordersRef = useRef(orders);

  ordersRef.current = orders;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, paddingBottom: spacing.sm },
        cartHeaderBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: colors.surfaceSoft,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        cartHeaderBtnText: {
          color: colors.textPrimary,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        },
        cartBadge: {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 4,
        },
        cartBadgeText: {
          color: colors.onPrimary,
          fontSize: 11,
          fontWeight: "700",
        },
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
        emptyText: {
          marginTop: spacing.lg,
          color: colors.textSecondary,
          fontSize: typography.body,
        },
      }),
    [colors, radii, sizes.tabBarOffset, spacing, typography],
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === SENT_TO_FACTORY),
    [orders],
  );

  const cartOrderIdSet = useMemo(() => new Set(cartOrderIds.map(String)), [cartOrderIds]);

  const availablePending = useMemo(
    () => pendingOrders.filter((order) => !cartOrderIdSet.has(String(order.id))),
    [pendingOrders, cartOrderIdSet],
  );

  const readyForDeliveryOrders = useMemo(
    () => orders.filter((order) => order.status === "Ready_For_Delivery"),
    [orders],
  );

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
        return list;
      } catch {
        if (!silent) {
          Alert.alert(t("delivery.ordersAlertTitle"), t("delivery.ordersLoadFailed"));
        }
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
        {availablePending.length > 0 ? (
          <Text style={styles.sectionLabel}>{t("delivery.pendingOrders")}</Text>
        ) : null}
      </View>
    ),
    [
      readyForDeliveryOrders.length,
      navigation,
      availablePending.length,
      styles,
      t,
      continueKey,
    ],
  );

  const cartOrdersCount = cartCount;
  const allPendingInCart =
    pendingOrders.length > 0 && cartOrdersCount === pendingOrders.length;

  const listEmpty = loading ? (
    <SkeletonList count={3} ItemComponent={OrderCardSkeleton} itemProps={{ showActions: true }} />
  ) : (
    <Text style={styles.emptyText}>
      {allPendingInCart ? t("delivery.allInCart") : t("delivery.noOrders")}
    </Text>
  );

  const openCart = useCallback(() => {
    navigation.navigate("DeliveryCart");
  }, [navigation]);

  return (
    <Screen contentStyle={styles.container} accessibilityState={loading ? { busy: true } : undefined}>
      <SectionHeader
        title={t("delivery.title")}
        rightAction={
          <Pressable style={styles.cartHeaderBtn} onPress={openCart}>
            <AppIcon name="cart-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.cartHeaderBtnText}>{t("delivery.openCart")}</Text>
            {cartOrdersCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartOrdersCount > 99 ? "99+" : cartOrdersCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />
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
