import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchOrderPaymentTotals } from "../../services/adminApi/orders";

export default function AdminPaymentsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography, radii } = useTheme();
  const [tab, setTab] = useState("customer");
  const [totals, setTotals] = useState({ byCustomer: [], byDepot: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
        tab: {
          flex: 1,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
        },
        tabActive: { backgroundColor: colors.primary },
        tabText: { fontWeight: "700", color: colors.textPrimary, fontSize: typography.bodySmall },
        tabTextActive: { color: colors.onPrimary },
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
      }),
    [colors, radii.pill, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setTotals(await fetchOrderPaymentTotals(token));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const rows = tab === "depot" ? totals.byDepot : totals.byCustomer;

  return (
    <Screen busy={loading && rows.length === 0}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "customer" && styles.tabActive]} onPress={() => setTab("customer")}>
          <Text style={[styles.tabText, tab === "customer" && styles.tabTextActive]}>
            {t("admin.payments.byCustomer")}
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "depot" && styles.tabActive]} onPress={() => setTab("depot")}>
          <Text style={[styles.tabText, tab === "depot" && styles.tabTextActive]}>
            {t("admin.payments.byDepot")}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item, index) => String(item.id || item.customerId || item.depotId || index)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.payments.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name || item.customerName || item.depotName || "—"}</Text>
            <Text style={styles.meta}>
              {t("admin.payments.total")}: {Number(item.totalAmount ?? item.total ?? 0).toLocaleString()}
              {item.currency ? ` ${item.currency}` : ""}
            </Text>
            {item.paidAmount != null || item.collected != null ? (
              <Text style={styles.meta}>
                {t("admin.payments.paid")}: {Number(item.paidAmount ?? item.collected ?? 0).toLocaleString()}
              </Text>
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}
