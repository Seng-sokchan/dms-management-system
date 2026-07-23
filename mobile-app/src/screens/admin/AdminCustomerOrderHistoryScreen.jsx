import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchAdminCustomers } from "../../services/adminApi/customers";
import { fetchOrders } from "../../services/adminApi/orders";

export default function AdminCustomerOrderHistoryScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
      }),
    [colors, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextCustomers, nextOrders] = await Promise.all([
        fetchAdminCustomers(token),
        fetchOrders(token),
      ]);
      setCustomers(nextCustomers);
      setOrders(nextOrders);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const rows = useMemo(() => {
    const counts = new Map();
    for (const order of orders) {
      const key = order.customerId != null ? String(order.customerId) : `name:${order.customerName || ""}`;
      const current = counts.get(key) || { key, customerId: order.customerId, name: order.customerDirectoryName || order.customerName || "—", count: 0 };
      current.count += 1;
      if (!current.name || current.name === "—") {
        current.name = order.customerDirectoryName || order.customerName || current.name;
      }
      counts.set(key, current);
    }
    for (const customer of customers) {
      const key = String(customer.id);
      if (!counts.has(key)) {
        counts.set(key, { key, customerId: customer.id, name: customer.name, count: 0 });
      } else if (!counts.get(key).name || counts.get(key).name === "—") {
        counts.get(key).name = customer.name;
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
  }, [customers, orders]);

  return (
    <Screen busy={loading && rows.length === 0}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.history.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{t("admin.history.orderCount", { count: item.count })}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}
