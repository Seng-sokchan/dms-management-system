import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, PrimaryButton, Screen } from "../components/ui";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  acceptSpecialDayAssignment,
  fetchDriverSpecialDayAssignments,
} from "../services/specialDayApi";

function stopLabel(row, t) {
  return row.customerName || row.depotName || t("specialDay.unknownTarget");
}

function isAccepted(row) {
  return String(row?.assignmentStatus || "").toLowerCase() === "accepted";
}

export default function DeliverySpecialDayScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showError } = useAlert();
  const { colors, spacing, typography } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        status: {
          marginTop: spacing.sm,
          fontSize: typography.caption,
          fontWeight: "700",
          color: colors.primary,
        },
        actions: { marginTop: spacing.md },
      }),
    [colors, spacing, typography],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchDriverSpecialDayAssignments(token);
      setRows(Array.isArray(data) ? data : []);
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

  const openMap = useCallback(
    (item) => {
      navigation.navigate("DeliverySpecialDayMap", {
        registration: {
          ...item,
          assignmentStatus: "accepted",
        },
      });
    },
    [navigation],
  );

  const handleAccept = useCallback(
    async (item) => {
      if (!token || !item?.id || acceptingId) return;
      setAcceptingId(String(item.id));
      try {
        await acceptSpecialDayAssignment(token, item.id);
        openMap({ ...item, assignmentStatus: "accepted" });
        void refresh();
      } catch (err) {
        showError(getApiErrorMessage(err, t("specialDay.acceptError")));
      } finally {
        setAcceptingId(null);
      }
    },
    [token, acceptingId, openMap, refresh, showError, t],
  );

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("specialDay.emptyAssignments")} /> : null}
        renderItem={({ item }) => {
          const accepted = isAccepted(item);
          const content = (
            <Card style={styles.card}>
              <Text style={styles.title}>{stopLabel(item, t)}</Text>
              <Text style={styles.meta}>
                {item.specialDayName} · {item.eventDate}
              </Text>
              <Text style={styles.meta}>
                {item.provinceName || t("specialDay.unspecifiedProvince")} · {item.itemName || "—"}
              </Text>
              <Text style={styles.status}>
                {accepted ? t("specialDay.assignmentAccepted") : t("specialDay.assignmentPending")}
              </Text>
              {!accepted ? (
                <View style={styles.actions}>
                  <PrimaryButton
                    title={t("specialDay.acceptAction")}
                    onPress={() => handleAccept(item)}
                    disabled={acceptingId === String(item.id)}
                  />
                </View>
              ) : (
                <Text style={styles.meta}>{t("specialDay.tapForMap")}</Text>
              )}
            </Card>
          );

          if (!accepted) return content;

          return (
            <Pressable onPress={() => openMap(item)} accessibilityRole="button">
              {content}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
