import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OrderPaymentActions, { formatPaymentAmount } from "../components/OrderPaymentActions";
import { Card, EmptyState, ErrorBanner, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";
import { usePaymentCompletionRefresh } from "../hooks/usePaymentCompletionRefresh";
import { formatOrderStatus } from "../utils/formatOrderStatus";

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { sizes, spacing, typography, colors } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing.md,
        },
        title: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          flex: 1,
        },
        meta: {
          marginTop: spacing.xs,
          color: colors.textMuted,
          fontSize: typography.bodySmall,
        },
        card: { marginBottom: spacing.md },
        list: { paddingBottom: sizes.tabBarOffset + spacing.md, flexGrow: 1 },
      }),
    [colors, sizes.tabBarOffset, spacing, typography],
  );

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await listMobileOrders(token);
      setOrders(Array.isArray(rows) ? rows : []);
      setLoadError("");
    } catch (err) {
      setLoadError(getApiErrorMessage(err, t("payment.ordersLoadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  usePaymentCompletionRefresh(() => {
    void loadOrders();
  });

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("payment.orderLine", { id: item.id, name: item.itemName || t("payment.itemFallback") })}
          </Text>
          <Text style={styles.meta}>
            {t("payment.orderMeta", {
              status: formatOrderStatus(item.status, t),
              amount: formatPaymentAmount(item.amountTotal, item.currency),
            })}
          </Text>
        </View>
      </View>
      <OrderPaymentActions order={item} navigation={navigation} token={token} />
    </Card>
  );

  return (
    <Screen busy={loading && orders.length === 0 && !loadError} busyMessage={t("payment.loading")}>
      <SectionHeader title={t("payment.myOrdersTitle")} subtitle={t("payment.myOrdersSubtitle")} />
      {loadError ? (
        <ErrorBanner
          title={t("payment.ordersLoadFailed")}
          message={loadError}
          onRetry={loadOrders}
        />
      ) : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadOrders}
        ListEmptyComponent={
          !loadError ? (
            <EmptyState
              icon="receipt"
              title={t("payment.noOrders")}
              message={loading ? t("payment.loading") : t("payment.noOrdersHint")}
            />
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}
