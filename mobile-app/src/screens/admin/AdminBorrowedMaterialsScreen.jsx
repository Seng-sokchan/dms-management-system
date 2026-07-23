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
  createBorrowMaterial,
  deleteBorrowMaterial,
  fetchBorrowMaterials,
  updateBorrowMaterial,
} from "../../services/adminApi/borrowMaterials";
import {
  deleteCustomerBorrowedMaterial,
  fetchCustomerBorrowedMaterials,
  upsertCustomerBorrowedMaterial,
} from "../../services/adminApi/customerBorrowedMaterials";
import {
  deleteBorrowMaterialOrderLoan,
  fetchBorrowMaterialOrderLoans,
} from "../../services/adminApi/borrowMaterialOrderLoans";
import { fetchBorrowMaterialMonthlySchedules } from "../../services/adminApi/borrowMaterialMonthlySchedules";
import { fetchAdminCustomers } from "../../services/adminApi/customers";

const EMPTY_MATERIAL = { name: "", note: "" };
const EMPTY_BORROW = { customerId: "", materialId: "", quantity: "1" };

export default function AdminBorrowedMaterialsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography, radii } = useTheme();
  const [tab, setTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [loans, setLoans] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [borrowFormOpen, setBorrowFormOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [borrowForm, setBorrowForm] = useState(EMPTY_BORROW);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
        tab: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceSoft,
        },
        tabActive: { backgroundColor: colors.primary },
        tabText: { fontSize: typography.caption, fontWeight: "700", color: colors.textPrimary },
        tabTextActive: { color: colors.onPrimary },
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        rowActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
        action: { fontSize: typography.bodySmall, fontWeight: "700", color: colors.textSecondary },
        danger: { color: colors.danger },
        add: { marginBottom: spacing.md },
      }),
    [colors, radii.pill, spacing, typography],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [m, b, l, s, c] = await Promise.all([
        fetchBorrowMaterials(token),
        fetchCustomerBorrowedMaterials(token),
        fetchBorrowMaterialOrderLoans(token),
        fetchBorrowMaterialMonthlySchedules(token),
        fetchAdminCustomers(token),
      ]);
      setMaterials(m);
      setBorrows(b);
      setLoans(l);
      setSchedules(s);
      setCustomers(c);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const saveMaterial = async () => {
    if (!String(materialForm.name || "").trim()) {
      showError(t("admin.crud.validationTitle"), t("admin.crud.nameRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = { name: materialForm.name.trim(), note: materialForm.note };
      if (editingMaterialId) await updateBorrowMaterial(token, editingMaterialId, payload);
      else await createBorrowMaterial(token, payload);
      setMaterialFormOpen(false);
      showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
      await load();
    } catch (err) {
      showError(t("admin.crud.saveFailed"), getApiErrorMessage(err, t("admin.crud.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const saveBorrow = async () => {
    if (!borrowForm.customerId || !borrowForm.materialId) {
      showError(t("admin.crud.validationTitle"), t("admin.borrowed.validation"));
      return;
    }
    setBusy(true);
    try {
      await upsertCustomerBorrowedMaterial(token, borrowForm.customerId, {
        materialId: borrowForm.materialId,
        quantity: Number(borrowForm.quantity) || 1,
      });
      setBorrowFormOpen(false);
      showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
      await load();
    } catch (err) {
      showError(t("admin.crud.saveFailed"), getApiErrorMessage(err, t("admin.crud.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const data =
    tab === "materials"
      ? materials
      : tab === "borrows"
        ? borrows
        : tab === "loans"
          ? loans
          : schedules;

  return (
    <Screen busy={(loading && data.length === 0) || busy}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <View style={styles.tabs}>
        {[
          ["materials", t("admin.borrowed.tabMaterials")],
          ["borrows", t("admin.borrowed.tabBorrows")],
          ["loans", t("admin.borrowed.tabLoans")],
          ["schedules", t("admin.borrowed.tabSchedules")],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "materials" ? (
        <PrimaryButton
          title={t("admin.common.new")}
          style={styles.add}
          onPress={() => {
            setEditingMaterialId(null);
            setMaterialForm(EMPTY_MATERIAL);
            setMaterialFormOpen(true);
          }}
        />
      ) : null}
      {tab === "borrows" ? (
        <PrimaryButton
          title={t("admin.common.new")}
          style={styles.add}
          onPress={() => {
            setBorrowForm(EMPTY_BORROW);
            setBorrowFormOpen(true);
          }}
        />
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item, index) => String(item.id || `${tab}-${index}`)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.borrowed.empty")} /> : null}
        renderItem={({ item }) => {
          if (tab === "materials") {
            return (
              <Card style={styles.card}>
                <Text style={styles.title}>{item.name}</Text>
                {item.note ? <Text style={styles.meta}>{item.note}</Text> : null}
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      setEditingMaterialId(item.id);
                      setMaterialForm({ name: item.name || "", note: item.note || "" });
                      setMaterialFormOpen(true);
                    }}
                  >
                    <Text style={styles.action}>{t("admin.common.edit")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmDelete(t("admin.borrowed.confirmDelete"), async () => {
                        await deleteBorrowMaterial(token, item.id);
                        await load();
                      })
                    }
                  >
                    <Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }
          if (tab === "borrows") {
            return (
              <Card style={styles.card}>
                <Text style={styles.title}>
                  {item.customerName || item.customerId} · {item.materialName || item.materialId}
                </Text>
                <Text style={styles.meta}>
                  {t("admin.borrowed.qty")}: {item.quantity}
                </Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() =>
                      confirmDelete(t("admin.borrowed.confirmDelete"), async () => {
                        await deleteCustomerBorrowedMaterial(token, item.customerId, item.materialId);
                        await load();
                      })
                    }
                  >
                    <Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }
          if (tab === "loans") {
            return (
              <Card style={styles.card}>
                <Text style={styles.title}>
                  {item.customerName || item.customerId} · {item.materialName || item.materialId}
                </Text>
                <Text style={styles.meta}>
                  {t("admin.borrowed.qty")}: {item.quantity}
                  {item.orderId ? ` · order #${item.orderId}` : ""}
                </Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() =>
                      confirmDelete(t("admin.borrowed.confirmDelete"), async () => {
                        await deleteBorrowMaterialOrderLoan(token, item.customerId, item.id);
                        await load();
                      })
                    }
                  >
                    <Text style={[styles.action, styles.danger]}>{t("admin.common.delete")}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }
          return (
            <Card style={styles.card}>
              <Text style={styles.title}>
                {item.customerName || item.customerId} · {item.materialName || item.materialId}
              </Text>
              <Text style={styles.meta}>
                {item.month || item.period || "—"}
                {item.status ? ` · ${item.status}` : ""}
              </Text>
            </Card>
          );
        }}
      />

      <AdminFormModal
        visible={materialFormOpen}
        title={editingMaterialId ? t("admin.borrowed.editMaterial") : t("admin.borrowed.createMaterial")}
        values={materialForm}
        onChange={setMaterialForm}
        fields={[
          { key: "name", label: t("admin.common.name") },
          { key: "note", label: t("admin.common.note"), multiline: true },
        ]}
        onSubmit={() => void saveMaterial()}
        onClose={() => setMaterialFormOpen(false)}
        busy={busy}
      />
      <AdminFormModal
        visible={borrowFormOpen}
        title={t("admin.borrowed.createBorrow")}
        values={borrowForm}
        onChange={setBorrowForm}
        fields={[{ key: "quantity", label: t("admin.borrowed.qty"), keyboardType: "number-pad" }]}
        selectFields={[
          {
            key: "customerId",
            label: t("admin.prices.customer"),
            options: customers.map((c) => ({ id: c.id, label: c.name })),
          },
          {
            key: "materialId",
            label: t("admin.borrowed.material"),
            options: materials.map((m) => ({ id: m.id, label: m.name })),
          },
        ]}
        onSubmit={() => void saveBorrow()}
        onClose={() => setBorrowFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
