import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchOrders } from "../../services/adminApi/orders";
import { formatOrderStatus } from "../../utils/formatOrderStatus";

function customerLabel(order, dash) {
  const directory =
    order.customerDirectoryName != null && String(order.customerDirectoryName).trim() !== ""
      ? String(order.customerDirectoryName).trim()
      : null;
  if (directory) return directory;
  const name =
    order.customerName != null && String(order.customerName).trim() !== ""
      ? String(order.customerName).trim()
      : null;
  return name || dash;
}

export default function AdminOrdersScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        meta: {
          marginTop: spacing.xs,
          fontSize: typography.bodySmall,
          color: colors.textMuted,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: spacing.md,
        },
        status: {
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.textSecondary,
        },
      }),
    [colors, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await fetchOrders(token);
      setOrders(rows);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.orders.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const dash = t("admin.orders.dash");

  return (
    <Screen busy={loading && orders.length === 0}>
      {error ? (
        <ErrorBanner title={t("admin.orders.loadFailed")} message={error} onRetry={() => void load()} />
      ) : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t("admin.orders.emptyTitle")} subtitle={t("admin.orders.emptyBody")} />
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={2}>
                {customerLabel(item, dash)}
              </Text>
              <Text style={styles.status}>
                {formatOrderStatus(item.status || item.statusName, t)}
              </Text>
            </View>
            <Text style={styles.meta}>
              {item.itemName || dash}
              {item.orderedQty != null ? ` × ${item.orderedQty}` : ""}
            </Text>
            {item.deliveryAgentName ? (
              <Text style={styles.meta}>
                {t("admin.orders.delivery")}: {item.deliveryAgentName}
              </Text>
            ) : null}
            {item.orderNo || item.masterOrderNo ? (
              <Text style={styles.meta}>{item.orderNo || item.masterOrderNo}</Text>
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}
