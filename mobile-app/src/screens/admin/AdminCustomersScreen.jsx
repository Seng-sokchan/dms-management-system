import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
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
  createCustomer,
  deleteCustomer,
  fetchAdminCustomers,
  updateCustomer,
} from "../../services/adminApi/customers";
import { fetchDepots } from "../../services/adminApi/depots";
import { fetchProvinces } from "../../services/adminApi/provinces";

const EMPTY = {
  name: "",
  phone: "",
  depotId: "",
  provinceId: "",
  latitude: "",
  longitude: "",
};

export default function AdminCustomersScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography, radii, borders } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [depots, setDepots] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        search: {
          marginBottom: spacing.md,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          fontSize: typography.body,
          ...borders.panel,
        },
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        rowActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
        action: { fontSize: typography.bodySmall, fontWeight: "700", color: colors.textSecondary },
        danger: { color: colors.danger },
        add: { marginBottom: spacing.md },
      }),
    [borders.panel, colors, radii.md, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [rows, nextDepots, nextProvinces] = await Promise.all([
        fetchAdminCustomers(token),
        fetchDepots(token),
        fetchProvinces(token),
      ]);
      setCustomers(rows);
      setDepots(nextDepots);
      setProvinces(nextProvinces);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.customers.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = [c.name, c.phone, c.code, c.depotName, c.provinceName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      phone: row.phone || "",
      depotId: row.depotId != null ? String(row.depotId) : "",
      provinceId: row.provinceId != null ? String(row.provinceId) : "",
      latitude: row.latitude != null ? String(row.latitude) : "",
      longitude: row.longitude != null ? String(row.longitude) : "",
    });
    setFormOpen(true);
  };

  const onSubmit = async () => {
    if (!String(form.name || "").trim()) {
      showError(t("admin.crud.validationTitle"), t("admin.crud.nameRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        depotId: form.depotId || null,
        provinceId: form.provinceId || null,
      };
      const lat = String(form.latitude || "").trim();
      const lng = String(form.longitude || "").trim();
      if (lat && lng) {
        payload.latitude = lat;
        payload.longitude = lng;
      }
      if (editingId) await updateCustomer(token, editingId, payload);
      else await createCustomer(token, payload);
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
    confirmDelete(t("admin.customers.confirmDelete"), async () => {
      try {
        await deleteCustomer(token, row.id);
        await load();
      } catch (err) {
        showError(t("admin.crud.deleteFailed"), getApiErrorMessage(err, t("admin.crud.deleteFailed")));
      }
    });
  };

  return (
    <Screen busy={(loading && customers.length === 0) || busy}>
      {error ? (
        <ErrorBanner title={t("admin.customers.loadFailed")} message={error} onRetry={() => void load()} />
      ) : null}
      <PrimaryButton title={t("admin.common.new")} onPress={openCreate} style={styles.add} />
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t("admin.customers.searchPlaceholder")}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t("admin.customers.emptyTitle")} subtitle={t("admin.customers.emptyBody")} />
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name || t("admin.customers.dash")}</Text>
            {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
            {item.depotName ? (
              <Text style={styles.meta}>
                {t("admin.customers.depot")}: {item.depotName}
              </Text>
            ) : null}
            {item.provinceName ? (
              <Text style={styles.meta}>
                {t("admin.customers.province")}: {item.provinceName}
              </Text>
            ) : null}
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
        title={editingId ? t("admin.customers.editTitle") : t("admin.customers.createTitle")}
        values={form}
        onChange={setForm}
        fields={[
          { key: "name", label: t("admin.common.name") },
          { key: "phone", label: t("admin.common.phone"), keyboardType: "phone-pad" },
          { key: "latitude", label: t("admin.customers.latitude"), keyboardType: "decimal-pad" },
          { key: "longitude", label: t("admin.customers.longitude"), keyboardType: "decimal-pad" },
        ]}
        selectFields={[
          {
            key: "depotId",
            label: t("admin.customers.depot"),
            options: depots.map((d) => ({ id: d.id, label: d.name })),
          },
          {
            key: "provinceId",
            label: t("admin.customers.province"),
            options: provinces.map((p) => ({ id: p.id, label: p.name })),
          },
        ]}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
