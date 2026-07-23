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
import { fetchAdminCustomers } from "../../services/adminApi/customers";
import { fetchDepots } from "../../services/adminApi/depots";
import { fetchItems } from "../../services/adminApi/items";
import {
  deleteCustomerItemPrice,
  fetchCustomerItemPrices,
  upsertCustomerItemPrice,
} from "../../services/adminApi/customerItemPrices";
import {
  deleteDepotItemPrice,
  fetchDepotItemPrices,
  upsertDepotItemPrice,
} from "../../services/adminApi/depotItemPrices";

const EMPTY = { entityId: "", itemId: "", currency: "KHR", unitPrice: "" };

/** mode: "customer" | "depot" */
export default function AdminPriceListScreen({ route }) {
  const mode = route?.params?.mode === "depot" ? "depot" : "customer";
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography } = useTheme();
  const [rows, setRows] = useState([]);
  const [entities, setEntities] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        rowActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
        action: { fontSize: typography.bodySmall, fontWeight: "700", color: colors.danger },
        add: { marginBottom: spacing.md },
      }),
    [colors, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextRows, nextEntities, nextItems] = await Promise.all([
        mode === "depot" ? fetchDepotItemPrices(token) : fetchCustomerItemPrices(token),
        mode === "depot" ? fetchDepots(token) : fetchAdminCustomers(token),
        fetchItems(token),
      ]);
      setRows(nextRows);
      setEntities(
        mode === "customer"
          ? nextEntities.filter((c) => !c.depotId)
          : nextEntities,
      );
      setItems(nextItems);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [mode, t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const entityOptions = useMemo(
    () => entities.map((e) => ({ id: e.id, label: e.name })),
    [entities],
  );
  const itemOptions = useMemo(
    () => items.map((i) => ({ id: i.id, label: i.name })),
    [items],
  );

  const onSubmit = async () => {
    if (!form.entityId || !form.itemId || form.unitPrice === "") {
      showError(t("admin.crud.validationTitle"), t("admin.prices.validation"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "depot") {
        await upsertDepotItemPrice(token, {
          depotId: String(form.entityId),
          itemId: String(form.itemId),
          currency: form.currency || "KHR",
          unitPrice: Number(form.unitPrice),
        });
      } else {
        await upsertCustomerItemPrice(token, {
          customerId: String(form.entityId),
          itemId: String(form.itemId),
          currency: form.currency || "KHR",
          unitPrice: Number(form.unitPrice),
        });
      }
      setFormOpen(false);
      setForm(EMPTY);
      showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
      await load();
    } catch (err) {
      showError(t("admin.crud.saveFailed"), getApiErrorMessage(err, t("admin.crud.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (row) => {
    confirmDelete(t("admin.prices.confirmDelete"), async () => {
      try {
        if (mode === "depot") await deleteDepotItemPrice(token, row.id);
        else await deleteCustomerItemPrice(token, row.id);
        await load();
      } catch (err) {
        showError(t("admin.crud.deleteFailed"), getApiErrorMessage(err, t("admin.crud.deleteFailed")));
      }
    });
  };

  return (
    <Screen busy={(loading && rows.length === 0) || busy}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <PrimaryButton
        title={t("admin.common.new")}
        onPress={() => {
          setForm(EMPTY);
          setFormOpen(true);
        }}
        style={styles.add}
      />
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.prices.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>
              {mode === "depot" ? item.depotName : item.customerName} · {item.itemName}
            </Text>
            <Text style={styles.meta}>
              {item.currency} {Number(item.unitPrice || 0).toLocaleString()}
            </Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => onDelete(item)}>
                <Text style={styles.action}>{t("admin.common.delete")}</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
      <AdminFormModal
        visible={formOpen}
        title={t("admin.prices.formTitle")}
        values={form}
        onChange={setForm}
        fields={[
          { key: "unitPrice", label: t("admin.prices.unitPrice"), keyboardType: "decimal-pad" },
        ]}
        selectFields={[
          {
            key: "entityId",
            label: mode === "depot" ? t("admin.prices.depot") : t("admin.prices.customer"),
            options: entityOptions,
          },
          { key: "itemId", label: t("admin.prices.item"), options: itemOptions },
          {
            key: "currency",
            label: t("admin.prices.currency"),
            options: [
              { id: "KHR", label: "KHR" },
              { id: "USD", label: "USD" },
            ],
          },
        ]}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
