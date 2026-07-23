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
import { fetchCatalogs } from "../../services/adminApi/catalogs";
import { createItem, deleteItem, fetchItems, updateItem } from "../../services/adminApi/items";

const EMPTY = { catalogId: "", name: "", sku: "" };

export default function AdminItemsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography } = useTheme();
  const [items, setItems] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
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
      const [nextItems, nextCatalogs] = await Promise.all([fetchItems(token), fetchCatalogs(token)]);
      setItems(nextItems);
      setCatalogs(nextCatalogs);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const catalogOptions = useMemo(
    () => catalogs.map((c) => ({ id: c.id, label: c.name })),
    [catalogs],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, catalogId: catalogs[0] ? String(catalogs[0].id) : "" });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      catalogId: row.catalogId != null ? String(row.catalogId) : "",
      name: row.name || "",
      sku: row.sku || "",
    });
    setFormOpen(true);
  };

  const onSubmit = async () => {
    if (!form.catalogId || !String(form.name || "").trim()) {
      showError(t("admin.crud.validationTitle"), t("admin.items.validation"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        catalogId: form.catalogId,
        name: form.name.trim(),
        sku: form.sku,
      };
      if (editingId) await updateItem(token, editingId, payload);
      else await createItem(token, payload);
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
    confirmDelete(t("admin.items.confirmDelete"), async () => {
      try {
        await deleteItem(token, row.id);
        await load();
      } catch (err) {
        showError(t("admin.crud.deleteFailed"), getApiErrorMessage(err, t("admin.crud.deleteFailed")));
      }
    });
  };

  if (!loading && catalogs.length === 0) {
    return (
      <Screen>
        <EmptyState title={t("admin.items.needCatalog")} subtitle={t("admin.items.needCatalogBody")} />
      </Screen>
    );
  }

  return (
    <Screen busy={(loading && items.length === 0) || busy}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <PrimaryButton title={t("admin.common.new")} onPress={openCreate} style={styles.add} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.items.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.catalogName || t("admin.orders.dash")}
              {item.sku ? ` · SKU ${item.sku}` : ""}
            </Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => openEdit(item)}>
                <Text style={styles.action}>{t("admin.common.edit")}</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(item)}>
                <Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
      <AdminFormModal
        visible={formOpen}
        title={editingId ? t("admin.items.editTitle") : t("admin.items.createTitle")}
        values={form}
        onChange={setForm}
        fields={[
          { key: "name", label: t("admin.common.name") },
          { key: "sku", label: t("admin.items.sku"), autoCapitalize: "characters" },
        ]}
        selectFields={[{ key: "catalogId", label: t("admin.items.catalog"), options: catalogOptions }]}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
