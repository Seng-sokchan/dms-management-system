import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeliveryCartCard } from "../components/DeliveryCartCard";
import { AppIcon, PrimaryButton, Screen, SectionHeader } from "../components/ui";
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

export default function DeliveryCartScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartOrderIds, clearCart, pruneCartIds, removeFromCart } = useDeliveryCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const ordersRef = useRef(orders);

  ordersRef.current = orders;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: { paddingBottom: spacing.sm },
        footer: {
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
        footerHint: {
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
          lineHeight: 20,
        },
      }),
    [colors, spacing, typography],
  );

  const cartOrderIdSet = useMemo(() => new Set(cartOrderIds.map(String)), [cartOrderIds]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === SENT_TO_FACTORY),
    [orders],
  );

  const cartOrders = useMemo(
    () => pendingOrders.filter((order) => cartOrderIdSet.has(String(order.id))),
    [pendingOrders, cartOrderIdSet],
  );

  const canStartDelivery =
    pendingOrders.length > 0 && cartOrders.length === pendingOrders.length;

  const footerHint = useMemo(() => {
    const cartCount = cartOrders.length;
    if (cartCount === 0) return "";
    if (canStartDelivery) {
      return t(cartCount === 1 ? "delivery.cartReady" : "delivery.cartReady_plural", {
        count: cartCount,
      });
    }
    return t("delivery.cartPartial", { count: cartCount, total: pendingOrders.length });
  }, [canStartDelivery, cartOrders.length, pendingOrders.length, t]);

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
        Alert.alert(t("delivery.startDeliveryTitle"), t("delivery.startPartialFailed"));
      } else {
        Alert.alert(t("delivery.startDeliveryTitle"), t("delivery.startDeliveryFailed"));
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
  ]);

  useFocusEffect(
    useCallback(() => {
      loadOrders().catch(() => {});
    }, [loadOrders]),
  );

  return (
    <Screen accessibilityState={loading ? { busy: true } : undefined}>
      <SectionHeader
        title={t("delivery.cartTitle")}
        rightAction={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        }
      />

      <View style={styles.body}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <DeliveryCartCard
            orders={cartOrders}
            totalPendingCount={pendingOrders.length}
            canStartDelivery={canStartDelivery}
            submitting={batchSubmitting}
            onStartDelivery={startDeliveryBatch}
            onRemoveFromCart={removeFromCart}
            showStartButton={false}
          />
        </ScrollView>

        {cartOrders.length > 0 ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
            <PrimaryButton
              title={t("delivery.startDelivery")}
              tone="success"
              onPress={startDeliveryBatch}
              loading={batchSubmitting}
              disabled={!canStartDelivery || batchSubmitting}
              icon={<AppIcon name="check-circle-outline" size={18} color={colors.onPrimary} />}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
