import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OrderPaymentActions, { formatPaymentAmount } from "../components/OrderPaymentActions";
import { Card, EmptyState, Screen, SectionHeader } from "../components/ui";
import { getApiErrorMessage } from "../services/apiClient";
import { listMobileOrders } from "../services/ordersApi";

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, radii, spacing, typography } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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
      }),
    [colors, spacing, typography],
  );

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await listMobileOrders(token);
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (err) {
      Alert.alert(t("payment.ordersLoadFailed"), getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("payment.orderLine", { id: item.id, name: item.itemName || t("payment.itemFallback") })}
          </Text>
          <Text style={styles.meta}>
            {t("payment.orderMeta", {
              status: item.status,
              amount: formatPaymentAmount(item.amountTotal, item.currency),
            })}
          </Text>
        </View>
      </View>
      <OrderPaymentActions order={item} navigation={navigation} token={token} />
    </Card>
  );

  return (
    <Screen>
      <SectionHeader title={t("payment.myOrdersTitle")} subtitle={t("payment.myOrdersSubtitle")} />
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadOrders}
        ListEmptyComponent={
          <EmptyState
            icon="receipt"
            title={t("payment.noOrders")}
            message={loading ? t("payment.loading") : t("payment.noOrdersHint")}
          />
        }
        contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}
      />
    </Screen>
  );
}
