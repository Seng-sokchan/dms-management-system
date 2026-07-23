import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, PrimaryButton, Screen } from "../components/ui";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  cancelSpecialDayRegistration,
  fetchMySpecialDayRegistrations,
  fetchOpenSpecialDays,
  registerForSpecialDay,
} from "../services/specialDayApi";

export default function SpecialDayOptInScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { colors, spacing, typography } = useTheme();
  const [days, setDays] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        badge: {
          marginTop: spacing.sm,
          alignSelf: "flex-start",
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.primary,
        },
      }),
    [colors, spacing, typography],
  );

  const mineByDay = useMemo(() => {
    const map = new Map();
    for (const row of mine) map.set(String(row.specialDayId), row);
    return map;
  }, [mine]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [openDays, myRegs] = await Promise.all([
        fetchOpenSpecialDays(token),
        fetchMySpecialDayRegistrations(token),
      ]);
      setDays(Array.isArray(openDays) ? openDays : []);
      setMine(Array.isArray(myRegs) ? myRegs : []);
    } catch (err) {
      setError(getApiErrorMessage(err, t("specialDay.loadError")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function handleRegister(dayId) {
    setBusyId(String(dayId));
    try {
      await registerForSpecialDay(token, dayId);
      showSuccess(t("specialDay.registeredOk"));
      await refresh();
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.registerError")));
    } finally {
      setBusyId("");
    }
  }

  async function handleCancel(dayId, registrationId) {
    setBusyId(String(dayId));
    try {
      await cancelSpecialDayRegistration(token, dayId, registrationId);
      showSuccess(t("specialDay.cancelledOk"));
      await refresh();
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.cancelError")));
    } finally {
      setBusyId("");
    }
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={days}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("specialDay.emptyOpenDays")} /> : null}
        renderItem={({ item }) => {
          const reg = mineByDay.get(String(item.id));
          return (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.eventDate} · {item.itemName || "—"} · {t(`specialDay.status.${item.status}`, item.status)}
              </Text>
              {reg ? <Text style={styles.badge}>{t("specialDay.youAreRegistered")}</Text> : null}
              <View style={{ marginTop: spacing.sm }}>
                {reg ? (
                  <PrimaryButton
                    title={t("specialDay.cancelRegistration")}
                    tone="soft"
                    disabled={Boolean(busyId)}
                    onPress={() => handleCancel(item.id, reg.id)}
                  />
                ) : (
                  <PrimaryButton
                    title={t("specialDay.registerAction")}
                    disabled={Boolean(busyId)}
                    onPress={() => handleRegister(item.id)}
                  />
                )}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
