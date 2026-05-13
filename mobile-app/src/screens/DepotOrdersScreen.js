import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { AppIcon, Card, EmptyState, PrimaryButton, Screen, SectionHeader } from "../components/ui";
import { listMobileOrders } from "../services/ordersApi";
import { getApiErrorMessage } from "../services/apiClient";
import { colors, radii, spacing, typography } from "../theme";

/**
 * Read-only list of orders belonging to customers in the current Depot user's
 * depot. The backend (`orderService.listForMobile`) scopes the rows server-side
 * via `customers.depot_id`.
 */
export default function DepotOrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const accessToken = typeof token === "string" ? token.trim() : "";
    if (!accessToken) return;
    try {
      const rows = await listMobileOrders(accessToken);
      setOrders(Array.isArray(rows) ? rows : []);
      setLoadError("");
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load orders"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

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

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </Screen>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <SectionHeader
          title="Depot orders"
          subtitle={
            orders.length > 0
              ? `${orders.length} order${orders.length === 1 ? "" : "s"} in your depot`
              : "No orders yet for your depot's customers."
          }
        />

        {totalsByStatus.length > 0 && (
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

        {!!loadError && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load orders</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <PrimaryButton
              title="Try Again"
              onPress={() => {
                setLoading(true);
                void load();
              }}
              style={styles.retryButton}
              icon={<AppIcon name="refresh" size={18} color="#fff" />}
            />
          </Card>
        )}

        <FlatList
          data={orders}
          keyExtractor={(order) => String(order.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={
            loadError ? null : (
              <EmptyState
                title="No orders"
                subtitle="Submit a batch from the Prepare tab to create new orders."
              />
            )
          }
        />
      </Screen>
    </SafeAreaView>
  );
}

function OrderCard({ order }) {
  const qty = Number(order?.orderedQty || 0);
  const total = Number(order?.amountTotal || 0);
  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>#{order.id}</Text>
        <Text style={styles.orderStatus}>{order.status || "-"}</Text>
      </View>
      <Text style={styles.orderLine}>
        Customer: {order.customerName || "-"}
      </Text>
      <Text style={styles.orderLine}>
        Item: {order.itemName || "-"}
        {order.itemSku ? ` · SKU ${order.itemSku}` : ""}
      </Text>
      <Text style={styles.orderLine}>
        Qty: {qty} · Total: {total.toLocaleString()} {order.currency || "KHR"}
      </Text>
      {!!order.createdAt && (
        <Text style={styles.orderMeta}>Created: {formatDate(order.createdAt)}</Text>
      )}
    </Card>
  );
}

function formatDate(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  errorCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
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
  retryButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    minWidth: 120,
  },
  list: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.surface,
  },
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
    color: colors.primary,
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
});
