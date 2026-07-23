import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, Screen } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchAdminCustomers } from "../../services/adminApi/customers";
import { fetchDepots } from "../../services/adminApi/depots";

export default function AdminCustomersByDepotScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const [depots, setDepots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        child: { marginTop: spacing.sm, paddingLeft: spacing.sm },
        childName: { fontSize: typography.bodySmall, color: colors.textPrimary, marginTop: spacing.xs },
      }),
    [colors, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextDepots, nextCustomers] = await Promise.all([
        fetchDepots(token),
        fetchAdminCustomers(token),
      ]);
      setDepots(nextDepots);
      setCustomers(nextCustomers);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const groups = useMemo(() => {
    return depots.map((depot) => ({
      ...depot,
      customers: customers.filter((c) => String(c.depotId) === String(depot.id)),
    }));
  }, [customers, depots]);

  return (
    <Screen busy={loading && groups.length === 0}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.customersByDepot.empty")} /> : null}
        renderItem={({ item }) => {
          const open = String(expandedId) === String(item.id);
          return (
            <Pressable onPress={() => setExpandedId(open ? null : item.id)}>
              <Card style={styles.card}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.meta}>
                  {t("admin.customersByDepot.count", { count: item.customers.length })}
                </Text>
                {open ? (
                  <View style={styles.child}>
                    {item.customers.length === 0 ? (
                      <Text style={styles.meta}>{t("admin.customersByDepot.none")}</Text>
                    ) : (
                      item.customers.map((c) => (
                        <Text key={c.id} style={styles.childName}>
                          {c.name}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </Text>
                      ))
                    )}
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
