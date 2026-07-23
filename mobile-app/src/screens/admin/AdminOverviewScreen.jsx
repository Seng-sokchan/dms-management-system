import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchDashboardSummary, fetchStatuses } from "../../services/adminApi/dashboard";
import { formatOrderStatus } from "../../utils/formatOrderStatus";

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function AdminOverviewScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [summary, setSummary] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, gap: spacing.md },
        sectionTitle: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        },
        kpiGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
        },
        kpiCard: {
          width: "48%",
          flexGrow: 1,
          minWidth: 140,
        },
        kpiLabel: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
        },
        kpiValue: {
          marginTop: spacing.xs,
          fontSize: typography.h2,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        statusRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        statusName: {
          flex: 1,
          fontSize: typography.body,
          color: colors.textPrimary,
          fontWeight: "600",
        },
        statusCount: {
          fontSize: typography.body,
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
      const [nextSummary, nextStatuses] = await Promise.all([
        fetchDashboardSummary(token),
        fetchStatuses(token),
      ]);
      setSummary(nextSummary);
      setStatuses(nextStatuses);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.overview.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const totals = summary?.totals || {};
  const statusSummary = summary?.statusSummary || {};
  const statusNames =
    statuses.length > 0
      ? statuses.map((row) => row.name || row)
      : Object.keys(statusSummary);

  return (
    <Screen busy={loading && !summary}>
      {error ? (
        <ErrorBanner title={t("admin.overview.loadFailed")} message={error} onRetry={() => void load()} />
      ) : null}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        {!summary && !loading ? (
          <EmptyState title={t("admin.overview.emptyTitle")} subtitle={t("admin.overview.emptyBody")} />
        ) : null}

        {summary ? (
          <>
            <Text style={styles.sectionTitle}>{t("admin.overview.atAGlance")}</Text>
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t("admin.overview.totalOrders")}</Text>
                <Text style={styles.kpiValue}>{formatNumber(totals.orders)}</Text>
              </Card>
              <Card style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t("admin.overview.deliveryAgents")}</Text>
                <Text style={styles.kpiValue}>{formatNumber(totals.deliveryAgents)}</Text>
              </Card>
              <Card style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t("admin.overview.revenueUsd")}</Text>
                <Text style={styles.kpiValue}>{formatNumber(totals.totalRevenue)}</Text>
              </Card>
              <Card style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t("admin.overview.revenueKhr")}</Text>
                <Text style={styles.kpiValue}>{formatNumber(totals.totalRevenueKhr)}</Text>
              </Card>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              {t("admin.overview.byStatus")}
            </Text>
            <Card>
              {statusNames.map((name) => (
                <View key={name} style={styles.statusRow}>
                  <Text style={styles.statusName}>{formatOrderStatus(name, t)}</Text>
                  <Text style={styles.statusCount}>{formatNumber(statusSummary[name] || 0)}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
