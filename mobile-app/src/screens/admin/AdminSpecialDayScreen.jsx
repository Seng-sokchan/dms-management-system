import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { fetchItems } from "../../services/adminApi/items";
import {
  createSpecialDay,
  fetchSpecialDayProgress,
  fetchSpecialDayRegistrations,
  fetchSpecialDays,
  updateSpecialDay,
  upsertSpecialDayAssignment,
} from "../../services/specialDayApi";

function targetLabel(row, t) {
  return row.customerName || row.depotName || t("specialDay.unknownTarget");
}

export default function AdminSpecialDayScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { colors, spacing, typography, radii } = useTheme();
  const [days, setDays] = useState([]);
  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [assignRow, setAssignRow] = useState(null);
  const [form, setForm] = useState({ name: "", eventDate: "", itemId: "", notes: "" });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        selectedCard: { borderColor: colors.primary, borderWidth: 2 },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
        stat: {
          flexGrow: 1,
          minWidth: "40%",
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceSoft,
        },
        statLabel: { fontSize: typography.caption, color: colors.textMuted },
        statValue: { marginTop: 2, fontSize: typography.h3, fontWeight: "700", color: colors.textPrimary },
        sectionTitle: {
          marginTop: spacing.md,
          marginBottom: spacing.sm,
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        actions: { gap: spacing.sm, marginBottom: spacing.md },
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
          maxHeight: "80%",
        },
        modalTitle: {
          fontSize: typography.h3,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
          color: colors.textPrimary,
        },
        agentRow: {
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        statusRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
        statusChip: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
        },
        statusChipActive: { backgroundColor: colors.primary },
        statusChipText: { color: colors.textPrimary, fontWeight: "600", fontSize: typography.caption },
        statusChipTextActive: { color: colors.onPrimary || "#fff" },
      }),
    [colors, spacing, typography, radii],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [dayRows, itemRows, agentRows] = await Promise.all([
        fetchSpecialDays(token),
        fetchItems(token),
        fetchDeliveryAgents(token),
      ]);
      setDays(Array.isArray(dayRows) ? dayRows : []);
      setItems(Array.isArray(itemRows) ? itemRows : []);
      setAgents(Array.isArray(agentRows) ? agentRows : []);
    } catch (err) {
      setError(getApiErrorMessage(err, t("specialDay.loadError")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const refreshDetail = useCallback(
    async (id) => {
      if (!token || !id) {
        setRegistrations([]);
        setProgress(null);
        return;
      }
      const [regs, prog] = await Promise.all([
        fetchSpecialDayRegistrations(token, id),
        fetchSpecialDayProgress(token, id),
      ]);
      setRegistrations(Array.isArray(regs) ? regs : []);
      setProgress(prog || null);
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedId) void refreshDetail(selectedId);
    }, [selectedId, refreshDetail]),
  );

  async function handleCreate() {
    if (!form.name.trim() || !form.eventDate || !form.itemId) {
      showError(t("specialDay.createRequired"));
      return;
    }
    setBusy(true);
    try {
      const created = await createSpecialDay(token, {
        name: form.name.trim(),
        eventDate: form.eventDate,
        itemId: Number(form.itemId),
        notes: form.notes.trim() || null,
      });
      setCreateOpen(false);
      setForm({ name: "", eventDate: "", itemId: "", notes: "" });
      await refresh();
      if (created?.id) setSelectedId(String(created.id));
      showSuccess(t("specialDay.created"));
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.saveError")));
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(status) {
    if (!selectedId) return;
    setBusy(true);
    try {
      await updateSpecialDay(token, selectedId, { status });
      await refresh();
      await refreshDetail(selectedId);
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.saveError")));
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(agentId) {
    if (!selectedId || !assignRow) return;
    setBusy(true);
    try {
      await upsertSpecialDayAssignment(token, selectedId, {
        registrationId: Number(assignRow.id),
        deliveryAgentId: Number(agentId),
      });
      setAssignRow(null);
      await refreshDetail(selectedId);
      showSuccess(t("specialDay.assignedOk"));
    } catch (err) {
      showError(getApiErrorMessage(err, t("specialDay.assignError")));
    } finally {
      setBusy(false);
    }
  }

  const selected = days.find((d) => String(d.id) === String(selectedId));

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}
      <View style={styles.actions}>
        <PrimaryButton title={t("specialDay.createAction")} onPress={() => setCreateOpen(true)} />
      </View>

      {!selectedId ? (
        <FlatList
          data={days}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={!loading ? <EmptyState title={t("specialDay.emptyDays")} /> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedId(String(item.id))}>
              <Card style={styles.card}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.eventDate} · {t(`specialDay.status.${item.status}`, item.status)}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                void refresh();
                void refreshDetail(selectedId);
              }}
            />
          }
        >
          <PrimaryButton
            title={t("specialDay.backToList")}
            tone="soft"
            onPress={() => setSelectedId("")}
          />
          <Card style={styles.card}>
            <Text style={styles.title}>{selected?.name}</Text>
            <Text style={styles.meta}>
              {selected?.eventDate} · {selected?.itemName || "—"}
            </Text>
            <View style={styles.statusRow}>
              {["open", "active", "closed"].map((status) => {
                const active = selected?.status === status;
                return (
                  <Pressable
                    key={status}
                    style={[styles.statusChip, active && styles.statusChipActive]}
                    onPress={() => handleStatus(status)}
                    disabled={busy || active}
                  >
                    <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                      {t(`specialDay.status.${status}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t("specialDay.registered")}</Text>
              <Text style={styles.statValue}>{progress?.registrationCount ?? 0}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t("specialDay.assigned")}</Text>
              <Text style={styles.statValue}>{progress?.assignedCount ?? 0}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t("specialDay.deliveredQty")}</Text>
              <Text style={styles.statValue}>{progress?.totalDeliveredQty ?? 0}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t("specialDay.trips")}</Text>
              <Text style={styles.statValue}>{progress?.deliveryCount ?? 0}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("specialDay.registrationsTitle")}</Text>
          {registrations.length === 0 ? <EmptyState title={t("specialDay.emptyRegistrations")} /> : null}
          {registrations.map((row) => (
            <Card key={row.id} style={styles.card}>
              <Text style={styles.title}>{targetLabel(row, t)}</Text>
              <Text style={styles.meta}>
                {row.provinceName || t("specialDay.unspecifiedProvince")} ·{" "}
                {row.deliveryAgentName || t("specialDay.unassigned")}
              </Text>
              <Text style={styles.meta}>
                {t("specialDay.deliveredShort")}: {row.deliveredQtyTotal || 0}
              </Text>
              <PrimaryButton
                title={t("specialDay.assignAction")}
                onPress={() => setAssignRow(row)}
                disabled={busy || selected?.status === "closed"}
              />
            </Card>
          ))}
        </ScrollView>
      )}

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("specialDay.createTitle")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("specialDay.name")}
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
            />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={form.eventDate}
              onChangeText={(eventDate) => setForm((f) => ({ ...f, eventDate }))}
            />
            <ScrollView style={{ maxHeight: 160, marginBottom: spacing.sm }}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.agentRow, String(form.itemId) === String(item.id) && styles.selectedCard]}
                  onPress={() => setForm((f) => ({ ...f, itemId: String(item.id) }))}
                >
                  <Text style={styles.title}>{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder={t("specialDay.notes")}
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={(notes) => setForm((f) => ({ ...f, notes }))}
            />
            <PrimaryButton title={t("specialDay.createAction")} onPress={handleCreate} disabled={busy} />
            <PrimaryButton title={t("common.cancel")} tone="soft" onPress={() => setCreateOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(assignRow)} transparent animationType="slide" onRequestClose={() => setAssignRow(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("specialDay.selectAgent")}</Text>
            {busy ? <ActivityIndicator color={colors.primary} /> : null}
            <FlatList
              data={agents}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable style={styles.agentRow} onPress={() => handleAssign(item.id)}>
                  <Text style={styles.title}>{item.name}</Text>
                  {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
                </Pressable>
              )}
            />
            <PrimaryButton title={t("common.cancel")} tone="soft" onPress={() => setAssignRow(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
