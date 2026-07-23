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
  createCatalog,
  deleteCatalog,
  fetchCatalogs,
  updateCatalog,
} from "../../services/adminApi/catalogs";

const EMPTY = { name: "", note: "" };

export default function AdminCatalogsScreen() {
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
  const [form, setForm] = useState(EMPTY);

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
    if (!token) return;
    setLoading(true);
    try {
      setRows(await fetchCatalogs(token));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || "", note: row.note || "" });
    setFormOpen(true);
  };

  const onSubmit = async () => {
    if (!String(form.name || "").trim()) {
      showError(t("admin.crud.validationTitle"), t("admin.crud.nameRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = { name: form.name.trim(), note: form.note };
      if (editingId) await updateCatalog(token, editingId, payload);
      else await createCatalog(token, payload);
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
    confirmDelete(t("admin.catalogs.confirmDelete"), async () => {
      try {
        await deleteCatalog(token, row.id);
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
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.catalogs.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            {item.note ? <Text style={styles.meta}>{item.note}</Text> : null}
            <View style={styles.rowActions}>
              <Pressable onPress={() => openEdit(item)}><Text style={styles.action}>{t("admin.common.edit")}</Text></Pressable>
              <Pressable onPress={() => onDelete(item)}><Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text></Pressable>
            </View>
          </Card>
        )}
      />
      <AdminFormModal
        visible={formOpen}
        title={editingId ? t("admin.catalogs.editTitle") : t("admin.catalogs.createTitle")}
        values={form}
        onChange={setForm}
        fields={[
          { key: "name", label: t("admin.common.name") },
          { key: "note", label: t("admin.common.note"), multiline: true },
        ]}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
