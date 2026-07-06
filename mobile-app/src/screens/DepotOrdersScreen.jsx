import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import DepotBatchPaymentActions from "../components/DepotBatchPaymentActions";
import OrderPaymentActions from "../components/OrderPaymentActions";
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
import { usePaymentCompletionRefresh } from "../hooks/usePaymentCompletionRefresh";
import { formatPaymentAmount } from "../utils/formatPaymentAmount";

function groupDepotOrders(orders) {
  const batchMap = new Map();
  const singles = [];

  for (const order of orders) {
    const batchId = order?.depotBatchId;
    if (batchId) {
      if (!batchMap.has(batchId)) batchMap.set(batchId, []);
      batchMap.get(batchId).push(order);
    } else {
      singles.push({ type: "single", order });
    }
  }

  const sections = [];
  for (const [batchId, batchOrders] of batchMap.entries()) {
    sections.push({ type: "batch", batchId, orders: batchOrders });
  }
  for (const item of singles) {
    sections.push(item);
  }

  sections.sort((a, b) => {
    const idA =
      a.type === "batch"
        ? Math.max(...a.orders.map((order) => Number(order.id) || 0))
        : Number(a.order.id) || 0;
    const idB =
      b.type === "batch"
        ? Math.max(...b.orders.map((order) => Number(order.id) || 0))
        : Number(b.order.id) || 0;
    return idB - idA;
  });

  return sections;
}

export default function DepotOrdersScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors, radii, sizes, spacing, typography, borders } = useTheme();
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
        list: { paddingBottom: sizes.tabBarOffset + spacing.md },
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
        batchTotal: {
          color: colors.textPrimary,
          fontSize: typography.body,
          fontWeight: "700",
          marginTop: spacing.sm,
        },
        batchPayLine: {
          color: colors.textSecondary,
          fontSize: typography.body,
          fontWeight: "600",
          marginTop: spacing.xs,
        },
        batchDivider: {
          marginTop: spacing.md,
          marginBottom: spacing.sm,
          ...borders.dividerTop,
        },
      }),
    [borders, colors, radii, sizes.tabBarOffset, spacing, typography],
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

  usePaymentCompletionRefresh(() => {
    void load();
  });

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

  const listSections = useMemo(() => groupDepotOrders(orders), [orders]);
  const locale = getAppLocale(i18n.language);

  const subtitle =
    orders.length > 0
      ? t(orders.length === 1 ? "depot.ordersSubtitleCount" : "depot.ordersSubtitleCount_plural", {
          count: orders.length,
        })
      : t("depot.ordersSubtitleEmpty");

  const headerSubtitle = loading ? t("depot.loadingOrders") : subtitle;

  const renderSection = useCallback(
    ({ item }) => {
      if (item.type === "batch") {
        return (
          <BatchOrderCard
            batchId={item.batchId}
            orders={item.orders}
            styles={styles}
            t={t}
            locale={locale}
            navigation={navigation}
            token={token}
          />
        );
      }
      return (
        <OrderCard
          order={item.order}
          styles={styles}
          t={t}
          locale={locale}
          navigation={navigation}
          token={token}
        />
      );
    },
    [locale, navigation, styles, t, token],
  );

  return (
    <Screen busy={loading && orders.length === 0}>
      <SectionHeader
        title={t("depot.ordersTitle")}
        subtitle={loading ? headerSubtitle : `${headerSubtitle}\n${t("depot.ordersPaymentHint")}`}
      />

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
          data={listSections}
          keyExtractor={(item) =>
            item.type === "batch" ? `batch-${item.batchId}` : `order-${item.order.id}`
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
          }
          renderItem={renderSection}
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

function sumBatchAmountDue(orders) {
  return (orders || []).reduce((sum, order) => {
    const status = order?.paymentStatus || "unpaid";
    if (status === "paid") return sum;
    return sum + Number(order?.amountTotal || 0);
  }, 0);
}

function BatchOrderCard({ batchId, orders, styles, t, locale, navigation, token }) {
  const totalAmount = orders.reduce((sum, order) => sum + Number(order?.amountTotal || 0), 0);
  const totalQuantity = orders.reduce((sum, order) => sum + Number(order?.orderedQty || 0), 0);
  const amountDue = sumBatchAmountDue(orders);
  const amountPaid = Math.max(0, totalAmount - amountDue);
  const currency = orders[0]?.currency || "KHR";

  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>{t("depot.batchGroupTitle")}</Text>
      </View>
      <Text style={styles.batchTotal}>
        {t(totalQuantity === 1 ? "depot.batchTotalQuantity" : "depot.batchTotalQuantity_plural", {
          qty: totalQuantity.toLocaleString(locale),
        })}
      </Text>
      {amountDue > 0 ? (
        <Text style={styles.batchPayLine}>
          {t("depot.batchToPay", {
            amount: formatPaymentAmount(amountDue, currency),
          })}
        </Text>
      ) : (
        <Text style={styles.batchPayLine}>
          {t("depot.batchPaidAmount", {
            amount: formatPaymentAmount(amountPaid, currency),
          })}
        </Text>
      )}
      <View style={styles.batchDivider} />
      <DepotBatchPaymentActions
        batchId={batchId}
        orders={orders}
        navigation={navigation}
        token={token}
      />
    </Card>
  );
}

function OrderCard({ order, styles, t, locale, navigation, token }) {
  const qty = Number(order?.orderedQty || 0);
  const total = Number(order?.amountTotal || 0);
  const skuPart = order.itemSku ? t("depot.orderItemSku", { sku: order.itemSku }) : "";
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
          total: formatPaymentAmount(total, order.currency || "KHR"),
        })}
      </Text>
      {!!order.deliveryAgentName && (
        <Text style={styles.orderLine}>
          {t("depot.orderDriver", { name: order.deliveryAgentName })}
        </Text>
      )}
      {!!order.createdAt && (
        <Text style={styles.orderMeta}>
          {t("depot.orderCreated", {
            date: formatDate(order.createdAt, locale),
          })}
        </Text>
      )}
      <OrderPaymentActions order={order} navigation={navigation} token={token} />
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
