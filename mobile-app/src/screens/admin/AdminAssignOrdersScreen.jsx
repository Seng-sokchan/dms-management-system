import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorBanner, PrimaryButton, Screen } from "../../components/ui";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/apiClient";
import { fetchDeliveryAgents } from "../../services/adminApi/deliveryAgents";
import {
  assignOrdersToAgent,
  fetchOrders,
  submitOrderToFactory,
} from "../../services/adminApi/orders";

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isCreatedToday(createdAt) {
  if (createdAt == null || createdAt === "") return false;
  const raw = String(createdAt).trim();
  const datePart = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart === localDateKey(new Date());
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;
  return localDateKey(parsed) === localDateKey(new Date());
}

function customerLabel(order, dash) {
  return (
    order.customerDirectoryName
    || order.customerName
    || dash
  );
}

export default function AdminAssignOrdersScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { colors, spacing, typography, radii, borders } = useTheme();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        cardSelected: {
          borderColor: colors.primary,
          borderWidth: 2,
        },
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
        actions: {
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        modalBackdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "flex-end",
        },
        modalSheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.lg,
          maxHeight: "70%",
        },
        modalTitle: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        agentRow: {
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        agentName: {
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        agentPhone: {
          marginTop: 2,
          fontSize: typography.bodySmall,
          color: colors.textMuted,
        },
        cancelBtn: {
          marginTop: spacing.md,
          alignItems: "center",
          paddingVertical: spacing.md,
        },
        cancelText: {
          fontSize: typography.body,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        hint: {
          marginBottom: spacing.sm,
          fontSize: typography.bodySmall,
          color: colors.textSecondary,
        },
      }),
    [borders, colors, radii.xl, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextOrders, nextAgents] = await Promise.all([
        fetchOrders(token),
        fetchDeliveryAgents(token),
      ]);
      setOrders(nextOrders);
      setAgents(nextAgents);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.assign.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const todayPreparing = useMemo(
    () =>
      orders.filter((order) => {
        const status = order.status || order.statusName;
        return status === "Owner_Preparing" && isCreatedToday(order.createdAt || order.created_at);
      }),
    [orders],
  );

  const dash = t("admin.orders.dash");

  const toggleSelect = (orderId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const onAssign = async (agent) => {
    const ids = [...selectedIds];
    if (!ids.length || !agent?.id) return;
    setBusy(true);
    setPickerOpen(false);
    try {
      await assignOrdersToAgent(token, ids, agent.id);
      setSelectedIds(new Set());
      await load();
      showSuccess(
        t("admin.assign.assignedTitle"),
        t("admin.assign.assignedMessage", { name: agent.name, count: ids.length }),
      );
    } catch (err) {
      showError(
        t("admin.assign.assignFailed"),
        getApiErrorMessage(err, t("admin.assign.assignFailed")),
      );
    } finally {
      setBusy(false);
    }
  };

  const onSubmitGroup = async (order) => {
    if (!order?.id) return;
    setBusy(true);
    try {
      await submitOrderToFactory(token, order.id);
      await load();
      showSuccess(t("admin.assign.submittedTitle"), t("admin.assign.submittedMessage"));
    } catch (err) {
      showError(
        t("admin.assign.submitFailed"),
        getApiErrorMessage(err, t("admin.assign.submitFailed")),
      );
    } finally {
      setBusy(false);
    }
  };

  const assignedToday = useMemo(
    () => todayPreparing.filter((o) => o.deliveryAgentId != null && o.deliveryAgentId !== ""),
    [todayPreparing],
  );

  return (
    <Screen busy={(loading && todayPreparing.length === 0) || busy}>
      {error ? (
        <ErrorBanner title={t("admin.assign.loadFailed")} message={error} onRetry={() => void load()} />
      ) : null}
      <Text style={styles.hint}>
        {t("admin.assign.hint", { count: todayPreparing.length, selected: selectedIds.size })}
      </Text>
      <View style={styles.actions}>
        <PrimaryButton
          title={t("admin.assign.assignSelected")}
          onPress={() => setPickerOpen(true)}
          disabled={selectedIds.size === 0 || busy}
        />
      </View>
      <FlatList
        data={todayPreparing}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t("admin.assign.emptyTitle")} subtitle={t("admin.assign.emptyBody")} />
          ) : null
        }
        ListFooterComponent={
          assignedToday.length > 0 ? (
            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <Text style={styles.title}>{t("admin.assign.submitSection")}</Text>
              {assignedToday.map((order) => (
                <PrimaryButton
                  key={`submit-${order.id}`}
                  title={t("admin.assign.submitOne", {
                    customer: customerLabel(order, dash),
                    agent: order.deliveryAgentName || dash,
                  })}
                  tone="soft"
                  onPress={() => void onSubmitGroup(order)}
                  disabled={busy}
                />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <Pressable onPress={() => toggleSelect(item.id)}>
              <Card style={[styles.card, selected && styles.cardSelected]}>
                <Text style={styles.title}>{customerLabel(item, dash)}</Text>
                <Text style={styles.meta}>
                  {item.itemName || dash}
                  {item.orderedQty != null ? ` × ${item.orderedQty}` : ""}
                </Text>
                <Text style={styles.meta}>
                  {t("admin.orders.delivery")}: {item.deliveryAgentName || t("admin.assign.unassigned")}
                </Text>
              </Card>
            </Pressable>
          );
        }}
      />

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>{t("admin.assign.pickAgent")}</Text>
            {agents.length === 0 ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <FlatList
                data={agents}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable style={styles.agentRow} onPress={() => void onAssign(item)}>
                    <Text style={styles.agentName}>{item.name}</Text>
                    {item.phone ? <Text style={styles.agentPhone}>{item.phone}</Text> : null}
                  </Pressable>
                )}
              />
            )}
            <Pressable style={styles.cancelBtn} onPress={() => setPickerOpen(false)}>
              <Text style={styles.cancelText}>{t("admin.assign.cancel")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
