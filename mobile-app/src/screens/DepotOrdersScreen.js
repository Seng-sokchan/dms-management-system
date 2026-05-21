import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAppLocale } from "../i18n/config";
import {
  AppIcon,
  Card,
  EmptyState,
  OrderCardSkeleton,
  PrimaryButton,
  Screen,
  SectionHeader,
  SkeletonBone,
  SkeletonList,
} from "../components/ui";
import { listMobileOrders } from "../services/ordersApi";
import { getApiErrorMessage } from "../services/apiClient";

export default function DepotOrdersScreen() {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chipSkeletonRow: {
          flexDirection: "row",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        statusRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        statusChip: {
          backgroundColor: colors.surfaceSoft,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        statusChipText: {
          color: colors.textSecondary,
          fontSize: typography.caption,
          fontWeight: "600",
        },
        errorCard: { marginBottom: spacing.md },
        errorTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: typography.body,
        },
        errorBody: {
          color: colors.textSecondary,
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
        },
        retryButton: { marginTop: spacing.md, alignSelf: "flex-start" },
        list: { paddingBottom: spacing.xxl },
        orderCard: { marginBottom: spacing.md },
        orderHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.sm,
        },
        orderTitle: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        orderStatus: {
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.textSecondary,
          textTransform: "uppercase",
        },
        orderLine: {
          color: colors.textSecondary,
          fontSize: typography.bodySmall,
          marginTop: 2,
        },
        orderMeta: {
          color: colors.textMuted,
          fontSize: typography.caption,
          marginTop: spacing.sm,
        },
      }),
    [colors, radii, spacing, typography],
  );

  const load = useCallback(async () => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    try {
      const rows = await listMobileOrders(accessToken);
      setOrders(Array.isArray(rows) ? rows : []);
      setLoadError("");
    } catch (error) {
      setLoadError(getApiErrorMessage(error, t("depot.loadOrdersError")));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function onRefresh() {
    setRefreshing(true);
    void load();
  }

  const totalsByStatus = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      const key = order?.status || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [orders]);

  const subtitle =
    orders.length > 0
      ? t(orders.length === 1 ? "depot.ordersSubtitleCount" : "depot.ordersSubtitleCount_plural", {
          count: orders.length,
        })
      : t("depot.ordersSubtitleEmpty");

  const headerSubtitle = loading ? t("depot.loadingOrders") : subtitle;

  return (
    <Screen accessibilityState={loading ? { busy: true } : undefined}>
      <SectionHeader title={t("depot.ordersTitle")} subtitle={headerSubtitle} />

      {loading ? (
        <>
          <View style={styles.chipSkeletonRow} accessible={false}>
            <SkeletonBone width={72} height={28} borderRadius={radii.pill} />
            <SkeletonBone width={88} height={28} borderRadius={radii.pill} />
            <SkeletonBone width={64} height={28} borderRadius={radii.pill} />
          </View>
          <SkeletonList count={4} ItemComponent={OrderCardSkeleton} />
        </>
      ) : null}

      {!loading && totalsByStatus.length > 0 && (
        <View style={styles.statusRow}>
          {totalsByStatus.map(([status, count]) => (
            <View key={status} style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {status}: {count}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!loading && !!loadError && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t("depot.loadOrdersError")}</Text>
          <Text style={styles.errorBody}>{loadError}</Text>
          <PrimaryButton
            title={t("common.tryAgain")}
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={styles.retryButton}
            icon={<AppIcon name="refresh" size={18} color={colors.onPrimary} />}
          />
        </Card>
      )}

      {!loading ? (
      <FlatList
        data={orders}
        keyExtractor={(order) => String(order.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
        }
        renderItem={({ item }) => (
          <OrderCard order={item} styles={styles} t={t} locale={getAppLocale(i18n.language)} />
        )}
        ListEmptyComponent={
          loadError ? null : (
            <EmptyState title={t("depot.noOrdersTitle")} subtitle={t("depot.noOrdersSubtitle")} />
          )
        }
      />
      ) : null}
    </Screen>
  );
}

function OrderCard({ order, styles, t, locale }) {
  const qty = Number(order?.orderedQty || 0);
  const total = Number(order?.amountTotal || 0);
  const skuPart = order.itemSku
    ? t("depot.orderItemSku", { sku: order.itemSku })
    : "";

  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>#{order.id}</Text>
        <Text style={styles.orderStatus}>{order.status || "-"}</Text>
      </View>
      <Text style={styles.orderLine}>
        {t("depot.orderCustomer", { name: order.customerName || "-" })}
      </Text>
      <Text style={styles.orderLine}>
        {t("depot.orderItem", { name: order.itemName || "-", sku: skuPart })}
      </Text>
      <Text style={styles.orderLine}>
        {t("depot.orderQty", {
          qty,
          total: total.toLocaleString(locale),
          currency: order.currency || "KHR",
        })}
      </Text>
      {!!order.createdAt && (
        <Text style={styles.orderMeta}>
          {t("depot.orderCreated", {
            date: formatDate(order.createdAt, locale),
          })}
        </Text>
      )}
    </Card>
  );
}

function formatDate(value, locale) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(locale);
  } catch {
    return String(value);
  }
}
