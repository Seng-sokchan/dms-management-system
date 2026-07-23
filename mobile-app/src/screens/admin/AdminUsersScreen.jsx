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
import { getApiErrorMessage, unwrapApiData } from "../../services/apiClient";
import { fetchAdminCustomers } from "../../services/adminApi/customers";
import { fetchDeliveryAgents } from "../../services/adminApi/deliveryAgents";
import { fetchDepots } from "../../services/adminApi/depots";
import { fetchRoles } from "../../services/adminApi/rules";
import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from "../../services/adminApi/users";

const HIDDEN_CREATE_ROLES = new Set(["Admin", "Owner"]);
const FALLBACK_ROLES = ["Logistics", "Delivery", "Customer", "Depot"];

const EMPTY_NEW = {
  name: "",
  username: "",
  password: "",
  role: "Customer",
  customerId: "",
  deliveryAgentId: "",
  depotId: "",
};

export default function AdminUsersScreen() {
  const { token, user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { showError, showSuccess, showAlert } = useAlert();
  const confirmDelete = useConfirmDelete();
  const { colors, spacing, typography } = useTheme();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_NEW);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { paddingBottom: spacing.xxl, flexGrow: 1 },
        card: { marginBottom: spacing.md },
        title: { fontSize: typography.body, fontWeight: "700", color: colors.textPrimary },
        meta: { marginTop: spacing.xs, fontSize: typography.bodySmall, color: colors.textMuted },
        rowActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm },
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
      const [nextUsers, nextRoles, nextCustomers, nextAgents, nextDepots] = await Promise.all([
        fetchUsers(token),
        fetchRoles(token),
        fetchAdminCustomers(token),
        fetchDeliveryAgents(token),
        fetchDepots(token),
      ]);
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      setRoles(Array.isArray(nextRoles) ? nextRoles : []);
      setCustomers(nextCustomers);
      setAgents(nextAgents);
      setDepots(nextDepots);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("admin.crud.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const roleNames = useMemo(() => {
    const fromApi = roles.map((r) => r.name).filter(Boolean);
    return fromApi.length ? fromApi : ["Admin", "Owner", ...FALLBACK_ROLES];
  }, [roles]);

  const createRoles = useMemo(
    () => roleNames.filter((r) => !HIDDEN_CREATE_ROLES.has(r)),
    [roleNames],
  );

  const visibleUsers = useMemo(
    () => users.filter((u) => String(u.username || "").trim().toLowerCase() !== "admin"),
    [users],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_NEW, role: createRoles[0] || "Customer" });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      username: row.username || "",
      password: "",
      role: row.role || "Customer",
      customerId: row.customerId != null ? String(row.customerId) : "",
      deliveryAgentId: row.deliveryAgentId != null ? String(row.deliveryAgentId) : "",
      depotId: row.depotId != null ? String(row.depotId) : "",
      isActive: row.isActive !== false,
    });
    setFormOpen(true);
  };

  const onSubmit = async () => {
    setBusy(true);
    try {
      if (editingId) {
        await updateUser(token, editingId, {
          name: form.name,
          role: form.role,
          isActive: form.isActive !== false,
          customerId: form.customerId || null,
          deliveryAgentId: form.deliveryAgentId || null,
          depotId: form.depotId || null,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        const res = await createUser(token, {
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role,
          customerId: form.customerId || null,
          deliveryAgentId: form.deliveryAgentId || null,
          depotId: form.depotId || null,
        });
        const data = unwrapApiData(res?.data) || res?.data || {};
        if (data.generatedUsername || data.generatedPassword || data.username) {
          showAlert({
            title: t("admin.users.credentialsTitle"),
            message: t("admin.users.credentialsMessage", {
              username: data.generatedUsername || data.username || form.username,
              password: data.generatedPassword || form.password || "—",
            }),
          });
        } else {
          showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
        }
      }
      setFormOpen(false);
      if (editingId) showSuccess(t("admin.crud.savedTitle"), t("admin.crud.savedMessage"));
      await load();
    } catch (err) {
      showError(t("admin.crud.saveFailed"), getApiErrorMessage(err, t("admin.crud.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (row) => {
    if (currentUser?.id != null && String(currentUser.id) === String(row.id)) {
      showError(t("admin.users.deleteSelfTitle"), t("admin.users.deleteSelfBody"));
      return;
    }
    confirmDelete(t("admin.users.confirmDelete"), async () => {
      try {
        await deleteUser(token, row.id);
        await load();
      } catch (err) {
        showError(t("admin.crud.deleteFailed"), getApiErrorMessage(err, t("admin.crud.deleteFailed")));
      }
    });
  };

  const onReset = (row) => {
    showAlert({
      title: t("admin.users.resetTitle"),
      message: t("admin.users.resetBody"),
      actions: [
        { text: t("admin.common.cancel"), style: "cancel" },
        {
          text: t("admin.users.resetAction"),
          onPress: async () => {
            try {
              const res = await resetUserPassword(token, row.id);
              const data = unwrapApiData(res?.data) || res?.data || {};
              showAlert({
                title: t("admin.users.credentialsTitle"),
                message: t("admin.users.credentialsMessage", {
                  username: row.username,
                  password: data.generatedPassword || data.password || "—",
                }),
              });
            } catch (err) {
              showError(t("admin.users.resetFailed"), getApiErrorMessage(err, t("admin.users.resetFailed")));
            }
          },
        },
      ],
    });
  };

  const selectFields = [
    {
      key: "role",
      label: t("admin.users.role"),
      options: (editingId ? roleNames : createRoles).map((r) => ({ id: r, label: r })),
    },
  ];
  if (form.role === "Customer") {
    selectFields.push({
      key: "customerId",
      label: t("admin.users.customer"),
      options: customers.map((c) => ({ id: c.id, label: c.name })),
    });
  }
  if (form.role === "Delivery") {
    selectFields.push({
      key: "deliveryAgentId",
      label: t("admin.users.deliveryAgent"),
      options: agents.map((a) => ({ id: a.id, label: a.name })),
    });
  }
  if (form.role === "Depot") {
    selectFields.push({
      key: "depotId",
      label: t("admin.users.depot"),
      options: depots.map((d) => ({ id: d.id, label: d.name })),
    });
  }

  return (
    <Screen busy={(loading && visibleUsers.length === 0) || busy}>
      {error ? <ErrorBanner title={t("admin.crud.loadFailed")} message={error} onRetry={() => void load()} /> : null}
      <PrimaryButton title={t("admin.common.new")} onPress={openCreate} style={styles.add} />
      <FlatList
        data={visibleUsers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        ListEmptyComponent={!loading ? <EmptyState title={t("admin.users.empty")} /> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name || item.username}</Text>
            <Text style={styles.meta}>
              {item.username} · {item.role}
              {item.isActive === false ? ` · ${t("admin.users.inactive")}` : ""}
            </Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => openEdit(item)}>
                <Text style={styles.action}>{t("admin.common.edit")}</Text>
              </Pressable>
              <Pressable onPress={() => onReset(item)}>
                <Text style={styles.action}>{t("admin.users.resetAction")}</Text>
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
        title={editingId ? t("admin.users.editTitle") : t("admin.users.createTitle")}
        values={form}
        onChange={setForm}
        fields={[
          { key: "name", label: t("admin.common.name") },
          ...(editingId
            ? [{ key: "password", label: t("admin.users.newPassword"), secure: true, autoCapitalize: "none" }]
            : [
                { key: "username", label: t("admin.users.username"), autoCapitalize: "none" },
                { key: "password", label: t("admin.users.password"), secure: true, autoCapitalize: "none" },
              ]),
        ]}
        selectFields={selectFields}
        onSubmit={() => void onSubmit()}
        onClose={() => setFormOpen(false)}
        busy={busy}
      />
    </Screen>
  );
}
