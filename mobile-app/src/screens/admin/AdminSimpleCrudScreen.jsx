import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AdminFormModal from "../../components/admin/AdminFormModal";
import { Card, EmptyState, ErrorBanner, PrimaryButton, Screen } from "../../components/ui";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  createProvince,
  deleteProvince,
  fetchProvinces,
  updateProvince,
} from "../../services/adminApi/provinces";
import {
  createDepot,
  deleteDepot,
  fetchDepots,
  updateDepot,
} from "../../services/adminApi/depots";
import {
  createProducer,
  deleteProducer,
  fetchProducers,
  updateProducer,
} from "../../services/adminApi/producers";
import {
  createDeliveryAgent,
  deleteDeliveryAgent,
  fetchDeliveryAgents,
  updateDeliveryAgent,
} from "../../services/adminApi/deliveryAgents";

const ENTITY_CONFIG = {
  provinces: {
    emptyKey: "admin.provinces.empty",
    createTitleKey: "admin.provinces.createTitle",
    editTitleKey: "admin.provinces.editTitle",
    confirmDeleteKey: "admin.provinces.confirmDelete",
    fields: (t) => [{ key: "name", label: t("admin.common.name") }],
    emptyForm: () => ({ name: "" }),
    fromRow: (row) => ({ name: row.name || "" }),
    toPayload: (form) => ({ name: String(form.name || "").trim() }),
    subtitle: () => null,
    fetchAll: fetchProvinces,
    create: createProvince,
    update: updateProvince,
    remove: deleteProvince,
  },
  depots: {
    emptyKey: "admin.depots.empty",
    createTitleKey: "admin.depots.createTitle",
    editTitleKey: "admin.depots.editTitle",
    confirmDeleteKey: "admin.depots.confirmDelete",
    fields: (t) => [
      { key: "name", label: t("admin.common.name") },
      { key: "phone", label: t("admin.common.phone"), keyboardType: "phone-pad" },
      { key: "address", label: t("admin.common.address"), multiline: true },
    ],
    emptyForm: () => ({ name: "", phone: "", address: "" }),
    fromRow: (row) => ({
      name: row.name || "",
      phone: row.phone || "",
      address: row.address || "",
    }),
    toPayload: (form) => ({
      name: String(form.name || "").trim(),
      phone: form.phone,
      address: form.address,
    }),
    subtitle: (row) => row.phone || row.address || null,
    fetchAll: fetchDepots,
    create: createDepot,
    update: updateDepot,
    remove: deleteDepot,
  },
  producers: {
    emptyKey: "admin.producers.empty",
    createTitleKey: "admin.producers.createTitle",
    editTitleKey: "admin.producers.editTitle",
    confirmDeleteKey: "admin.producers.confirmDelete",
    fields: (t) => [
      { key: "name", label: t("admin.common.name") },
      { key: "phone", label: t("admin.common.phone"), keyboardType: "phone-pad" },
      { key: "capacityNote", label: t("admin.common.note"), multiline: true },
    ],
    emptyForm: () => ({ name: "", phone: "", capacityNote: "" }),
    fromRow: (row) => ({
      name: row.name || "",
      phone: row.phone || "",
      capacityNote: row.capacityNote || "",
    }),
    toPayload: (form) => ({
      name: String(form.name || "").trim(),
      phone: form.phone,
      capacityNote: form.capacityNote,
    }),
    subtitle: (row) => row.phone || row.capacityNote || null,
    fetchAll: fetchProducers,
    create: createProducer,
    update: updateProducer,
    remove: deleteProducer,
  },
  deliveryAgents: {
    emptyKey: "admin.deliveryAgents.empty",
    createTitleKey: "admin.deliveryAgents.createTitle",
    editTitleKey: "admin.deliveryAgents.editTitle",
    confirmDeleteKey: "admin.deliveryAgents.confirmDelete",
    fields: (t) => [
      { key: "name", label: t("admin.common.name") },
      { key: "phone", label: t("admin.common.phone"), keyboardType: "phone-pad" },
    ],
    emptyForm: () => ({ name: "", phone: "" }),
    fromRow: (row) => ({ name: row.name || "", phone: row.phone || "" }),
    toPayload: (form) => ({
      name: String(form.name || "").trim(),
      phone: form.phone,
    }),
    subtitle: (row) => row.phone || null,
    fetchAll: fetchDeliveryAgents,
    create: createDeliveryAgent,
    update: updateDeliveryAgent,
    remove: deleteDeliveryAgent,
  },
};

export default function AdminSimpleCrudScreen({ route }) {
  const entityKey = route?.params?.entityKey;
  const config = ENTITY_CONFIG[entityKey];
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(config ? config.emptyForm() : {});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        rowActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
        action: { fontSize: typography.bodySmall, fontWeight: "700", color: colors.textSecondary },
        danger: { color: colors.danger },
        add: { marginBottom: spacing.md },
      }),
    [colors, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token || !config) return;
    setLoading(true);
    try {
      setRows(await config.fetchAll(token));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [config, t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!config) {
    return (
      <Screen>
        <EmptyState title={t("admin.comingSoon.title")} subtitle={t("admin.comingSoon.body")} />
      </Screen>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(config.emptyForm());
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm(config.fromRow(row));
    setFormOpen(true);
  };

  const onSubmit = async () => {
    const payload = config.toPayload(form);
    if (!payload.name) {
      showError(t("admin.crud.validationTitle"), t("admin.crud.nameRequired"));
      return;
    }
    setBusy(true);
    try {
      if (editingId) await config.update(token, editingId, payload);
      else await config.create(token, payload);
      setFormOpen(false);
      showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
      await load();
    } catch (err) {
      showError(t("admin.crud.saveFailed"), getApiErrorMessage(err, t("admin.crud.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (row) => {
    confirmDelete(t(config.confirmDeleteKey), async () => {
      try {
        await config.remove(token, row.id);
        await load();
      } catch (err) {
        showError(t("admin.crud.deleteFailed"), getApiErrorMessage(err, t("admin.crud.deleteFailed")));
      }
    });
  };

  return (
    <Screen busy={(loading && rows.length === 0) || busy}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <PrimaryButton title={t("admin.common.new")} onPress={openCreate} style={styles.add} />
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t(config.emptyKey)} /> : null}
        renderItem={({ item }) => {
          const sub = config.subtitle(item);
          return (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              {sub ? <Text style={styles.meta}>{sub}</Text> : null}
              <View style={styles.rowActions}>
                <Pressable onPress={() => openEdit(item)}>
                  <Text style={styles.action}>{t("admin.common.edit")}</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(item)}>
                  <Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text>
                </Pressable>
              </View>
            </Card>
          );
        }}
      />
      <AdminFormModal
        visible={formOpen}
        title={t(editingId ? config.editTitleKey : config.createTitleKey)}
        values={form}
        onChange={setForm}
        fields={config.fields(t)}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
