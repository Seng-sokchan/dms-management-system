import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import "./UsersPage.css";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const FALLBACK_ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];
const HIDDEN_CREATE_ROLES = new Set(["Admin", "Owner"]);
const DEFAULT_CREATE_ROLE = "Customer";

function linkedCustomerLabel(customers, customerId) {
  if (customerId == null || String(customerId).trim() === "") return "—";
  const c = customers.find((row) => String(row.id) === String(customerId));
  if (!c) return `#${customerId}`;
  const name = (c.name && String(c.name).trim()) || "";
  return name ? `${name} (#${c.id})` : `Customer #${c.id}`;
}

function linkedDeliveryAgentLabel(deliveryAgents, deliveryAgentId) {
  if (deliveryAgentId == null || String(deliveryAgentId).trim() === "") return "—";
  const a = deliveryAgents.find((row) => String(row.id) === String(deliveryAgentId));
  if (!a) return `#${deliveryAgentId}`;
  const name = (a.name && String(a.name).trim()) || "";
  return name ? `${name} (#${a.id})` : `Agent #${a.id}`;
}

function linkedDepotLabel(depots, depotId) {
  if (depotId == null || String(depotId).trim() === "") return "—";
  const d = depots.find((row) => String(row.id) === String(depotId));
  if (!d) return `#${depotId}`;
  const name = (d.name && String(d.name).trim()) || "";
  return name ? `${name} (#${d.id})` : `Depot #${d.id}`;
}

const EMPTY_EDIT = {
  id: "",
  name: "",
  username: "",
  password: "",
  role: "Owner",
  isActive: true,
  customerId: "",
  deliveryAgentId: "",
  depotId: "",
  initialRole: "Owner",
  initialCustomerId: "",
  initialDeliveryAgentId: "",
  initialDepotId: "",
};

const EMPTY_NEW = {
  name: "",
  username: "",
  password: "",
  role: DEFAULT_CREATE_ROLE,
  customerId: "",
  deliveryAgentId: "",
  depotId: "",
};

export function UsersPage({
  users = [],
  customers = [],
  deliveryAgents = [],
  depots = [],
  currentUser,
  newUser,
  setNewUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onResetUserPassword,
  roles = [],
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [editingUser, setEditingUser] = useState(EMPTY_EDIT);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const roleNames = useMemo(() => {
    const fromApi = Array.isArray(roles) ? roles.map((row) => row.name).filter(Boolean) : [];
    return fromApi.length ? fromApi : FALLBACK_ROLES;
  }, [roles]);
  const createRoleNames = useMemo(
    () => roleNames.filter((role) => !HIDDEN_CREATE_ROLES.has(role)),
    [roleNames],
  );
  const isEditing = useMemo(() => Boolean(editingUser.id), [editingUser.id]);
  const filteredUsers = useMemo(() => {
    const visibleUsers = users.filter(
      (entry) => String(entry.username || "").trim().toLowerCase() !== "admin",
    );
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return visibleUsers;
    return visibleUsers.filter((entry) =>
      [
        entry.id,
        entry.name,
        entry.username,
        entry.role,
        entry.customerId,
        linkedCustomerLabel(customers, entry.customerId),
        entry.deliveryAgentId,
        linkedDeliveryAgentLabel(deliveryAgents, entry.deliveryAgentId),
        entry.depotId,
        linkedDepotLabel(depots, entry.depotId),
        entry.isActive ? t("users.active") : t("users.inactive"),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [users, customers, deliveryAgents, depots, appliedSearch, t]);
  const {
    page,
    pageSize,
    paged: pagedUsers,
    setPage,
    setPageSize,
  } = usePagination(filteredUsers, { resetKey: appliedSearch });

  function closeCreateModal() {
    setCreateModalOpen(false);
  }

  function requestOpenCreateModal() {
    setNewUser({ ...EMPTY_NEW });
    setCreateModalOpen(true);
  }

  function requestCloseCreateModal() {
    closeCreateModal();
  }

  async function submitCreate(event) {
    event.preventDefault();
    const result = await onCreateUser(event);
    const ok = result?.ok ?? result;
    if (ok) {
      closeCreateModal();
      if (result?.generatedUsername || result?.generatedPassword) {
        setCreatedCredentials({
          username: result.generatedUsername,
          password: result.generatedPassword,
          variant: "create",
        });
      }
    }
  }

  function startEdit(user) {
    const role = user.role || "Owner";
    setEditingUser({
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      password: "",
      role,
      isActive: user.isActive !== false,
      customerId: user.customerId || "",
      deliveryAgentId: user.deliveryAgentId || "",
      depotId: user.depotId || "",
      initialRole: role,
      initialCustomerId: user.customerId || "",
      initialDeliveryAgentId: user.deliveryAgentId || "",
      initialDepotId: user.depotId || "",
    });
  }

  function requestCancelEdit() {
    setEditingUser(EMPTY_EDIT);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingUser.id) return;
    const payload = {
      name: editingUser.name,
      username: editingUser.username,
      role: editingUser.role,
    };
    if (editingUser.password) {
      payload.password = editingUser.password;
    }
    if (editingUser.role === "Customer") {
      payload.customerId = editingUser.customerId.trim() === "" ? null : editingUser.customerId.trim();
    } else if (
      editingUser.initialRole === "Customer" &&
      String(editingUser.initialCustomerId || "").trim() !== ""
    ) {
      payload.customerId = null;
    }
    if (editingUser.role === "Delivery") {
      payload.deliveryAgentId =
        editingUser.deliveryAgentId.trim() === "" ? null : editingUser.deliveryAgentId.trim();
    } else if (
      editingUser.initialRole === "Delivery" &&
      String(editingUser.initialDeliveryAgentId || "").trim() !== ""
    ) {
      payload.deliveryAgentId = null;
    }
    if (editingUser.role === "Depot") {
      payload.depotId = editingUser.depotId.trim() === "" ? null : editingUser.depotId.trim();
    } else if (
      editingUser.initialRole === "Depot" &&
      String(editingUser.initialDepotId || "").trim() !== ""
    ) {
      payload.depotId = null;
    }
    await onUpdateUser(editingUser.id, payload);
    setEditingUser(EMPTY_EDIT);
  }

  async function handleDelete(userId) {
    if (
      !(await confirm({
        title: t("confirm.deleteTitle"),
        message: t("users.confirmDelete"),
        tone: "danger",
      }))
    ) {
      return;
    }
    if (editingUser.id === userId) {
      setEditingUser(EMPTY_EDIT);
    }
    await onDeleteUser(userId);
  }

  async function handleResetPassword(user) {
    if (
      !(await confirm({
        title: t("users.resetPasswordTitle"),
        message: t("users.confirmResetPassword", { name: user.name || user.username }),
        tone: "danger",
      }))
    ) {
      return;
    }
    const result = await onResetUserPassword(user.id);
    if (result?.ok && result.generatedPassword) {
      setCreatedCredentials({
        username: result.generatedUsername || user.username,
        password: result.generatedPassword,
        variant: "reset",
      });
    }
  }

  return (
    <section className="admin-page">
      <div className="section-heading section-heading--with-actions">
        <div className="section-heading-text">
          <h2>{t("users.title")}</h2>
          <p className="section-lead">{t("users.lead")}</p>
        </div>
        <div className="section-heading-actions">
          <Button variant="primary" onClick={requestOpenCreateModal}>
            {t("users.addUser")}
          </Button>
        </div>
      </div>

      <section className="panel entity-list">
        <h3>{t("users.listTitle")}</h3>
        {filteredUsers.length === 0 ? (
          <p className="entity-list-empty">{t("users.empty")}</p>
        ) : (
          <DataTable
            showSearch
            searchValue={searchText}
            onSearchValueChange={setSearchText}
            onSearch={() => setAppliedSearch(searchText)}
            searchPlaceholder={t("users.searchPlaceholder", { defaultValue: "Search users..." })}
            searchButtonLabel={t("common.search", { defaultValue: "Search" })}
            pagination={{
              page,
              pageSize,
              totalRows: filteredUsers.length,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t("users.name")}</th>
                  <th>{t("users.username")}</th>
                  <th>{t("users.role")}</th>
                  <th>{t("users.linkedCustomer")}</th>
                  <th>{t("users.linkedDeliveryAgent")}</th>
                  <th>{t("users.linkedDepot")}</th>
                  <th>{t("users.active")}/{t("users.inactive")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>@{user.username}</td>
                    <td>{t(`roles.${user.role}`, { defaultValue: user.role })}</td>
                    <td>{linkedCustomerLabel(customers, user.customerId)}</td>
                    <td>{linkedDeliveryAgentLabel(deliveryAgents, user.deliveryAgentId)}</td>
                    <td>{linkedDepotLabel(depots, user.depotId)}</td>
                    <td>{user.isActive ? t("users.active") : t("users.inactive")}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(user)}>
                          {t("users.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void handleResetPassword(user)}
                          disabled={currentUser?.id === user.id || !user.isActive}
                        >
                          {t("users.resetPassword")}
                        </Button>
                        <Button
                          variant="ghost"
                          tone="delete"
                          onClick={() => void handleDelete(user.id)}
                          disabled={currentUser?.id === user.id || !user.isActive}
                        >
                          {t("users.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </section>

      {createModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCloseCreateModal}
        >
          <form
            className="panel form modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-create-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitCreate}
          >
            <h3 id="user-create-title">{t("users.formTitle")}</h3>
            <label className="form-label" htmlFor="user-name">{t("users.name")}</label>
            <input id="user-name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} required minLength={2} autoFocus />

            <label className="form-label" htmlFor="user-role">{t("users.role")}</label>
            <select
              id="user-role"
              value={newUser.role}
              onChange={(event) => {
                const role = event.target.value;
                setNewUser((prev) => ({
                  ...prev,
                  role,
                  ...(role !== "Customer" ? { customerId: "" } : {}),
                  ...(role !== "Delivery" ? { deliveryAgentId: "" } : {}),
                  ...(role !== "Depot" ? { depotId: "" } : {}),
                }));
              }}
              required
            >
              {createRoleNames.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            {newUser.role === "Customer" ? (
              <>
                <label className="form-label" htmlFor="user-create-customer">{t("users.linkedCustomer")}</label>
                <select
                  id="user-create-customer"
                  value={newUser.customerId || ""}
                  onChange={(event) => setNewUser({ ...newUser, customerId: event.target.value })}
                >
                  <option value="">{t("users.selectCustomer")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.name && String(c.name).trim()) || `Customer #${c.id}`} (#{c.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.customerLinkHint")}
                </p>
              </>
            ) : null}

            {newUser.role === "Delivery" ? (
              <>
                <label className="form-label" htmlFor="user-create-delivery-agent">
                  {t("users.linkedDeliveryAgent")}
                </label>
                <select
                  id="user-create-delivery-agent"
                  value={newUser.deliveryAgentId || ""}
                  onChange={(event) => setNewUser({ ...newUser, deliveryAgentId: event.target.value })}
                >
                  <option value="">{t("users.selectDeliveryAgent")}</option>
                  {deliveryAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.name && String(a.name).trim()) || `Agent #${a.id}`} (#{a.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.deliveryLinkHint")}
                </p>
              </>
            ) : null}

            {newUser.role === "Depot" ? (
              <>
                <label className="form-label" htmlFor="user-create-depot">{t("users.linkedDepot")}</label>
                <select
                  id="user-create-depot"
                  value={newUser.depotId || ""}
                  onChange={(event) => setNewUser({ ...newUser, depotId: event.target.value })}
                >
                  <option value="">{t("users.selectDepot")}</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {(d.name && String(d.name).trim()) || `Depot #${d.id}`} (#{d.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.depotLinkHint")}
                </p>
              </>
            ) : null}

            <div className="row-actions">
              <Button variant="primary" type="submit">{t("users.save")}</Button>
              <Button variant="ghost" tone="cancel" onClick={requestCloseCreateModal}>{t("users.cancel")}</Button>
            </div>
          </form>
        </div>
      ) : null}

      {createdCredentials ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setCreatedCredentials(null)}
        >
          <div
            className="panel form modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="creds-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="creds-modal-title">
              {createdCredentials.variant === "reset"
                ? t("users.credentialsResetTitle")
                : t("users.credentialsTitle")}
            </h3>
            <p className="section-lead">
              {createdCredentials.variant === "reset"
                ? t("users.credentialsResetHint")
                : t("users.credentialsHint")}
            </p>

            <label className="form-label">{t("users.username")}</label>
            <div className="credentials-copy-row">
              <input
                type="text"
                readOnly
                value={createdCredentials.username || ""}
                className="input-readonly input-monospace"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigator.clipboard?.writeText(createdCredentials.username || "")}
              >
                {t("users.copy")}
              </Button>
            </div>

            <label className="form-label">{t("users.password")}</label>
            <div className="credentials-copy-row">
              <input
                type="text"
                readOnly
                value={createdCredentials.password}
                className="input-readonly input-monospace"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigator.clipboard?.writeText(createdCredentials.password)}
              >
                {t("users.copy")}
              </Button>
            </div>

            <div className="row-actions" style={{ marginTop: "1rem" }}>
              <Button variant="primary" onClick={() => setCreatedCredentials(null)}>
                {t("users.done")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCancelEdit}
        >
          <form
            className="panel form modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-edit-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitEdit}
          >
            <h3 id="user-edit-title">{t("users.editTitle")}</h3>
            <label className="form-label" htmlFor="user-edit-name">{t("users.name")}</label>
            <input id="user-edit-name" value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} required minLength={2} />

            <label className="form-label" htmlFor="user-edit-username">{t("users.username")}</label>
            <input id="user-edit-username" value={editingUser.username} onChange={(event) => setEditingUser({ ...editingUser, username: event.target.value })} required minLength={3} />

            <label className="form-label" htmlFor="user-edit-password">{t("users.passwordOptional")}</label>
            <input id="user-edit-password" type="password" value={editingUser.password} onChange={(event) => setEditingUser({ ...editingUser, password: event.target.value })} minLength={6} />

            <label className="form-label" htmlFor="user-edit-role">{t("users.role")}</label>
            <select
              id="user-edit-role"
              value={editingUser.role}
              onChange={(event) => {
                const role = event.target.value;
                setEditingUser((prev) => ({
                  ...prev,
                  role,
                  ...(role !== "Customer" ? { customerId: "" } : {}),
                  ...(role !== "Delivery" ? { deliveryAgentId: "" } : {}),
                  ...(role !== "Depot" ? { depotId: "" } : {}),
                }));
              }}
              required
            >
              {roleNames.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            {editingUser.role === "Customer" ? (
              <>
                <label className="form-label" htmlFor="user-edit-customer">{t("users.linkedCustomer")}</label>
                <select
                  id="user-edit-customer"
                  value={editingUser.customerId || ""}
                  onChange={(event) => setEditingUser({ ...editingUser, customerId: event.target.value })}
                >
                  <option value="">{t("users.selectCustomer")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.name && String(c.name).trim()) || `Customer #${c.id}`} (#{c.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.customerLinkHint")}
                </p>
              </>
            ) : null}

            {editingUser.role === "Delivery" ? (
              <>
                <label className="form-label" htmlFor="user-edit-delivery-agent">
                  {t("users.linkedDeliveryAgent")}
                </label>
                <select
                  id="user-edit-delivery-agent"
                  value={editingUser.deliveryAgentId || ""}
                  onChange={(event) => setEditingUser({ ...editingUser, deliveryAgentId: event.target.value })}
                >
                  <option value="">{t("users.selectDeliveryAgent")}</option>
                  {deliveryAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.name && String(a.name).trim()) || `Agent #${a.id}`} (#{a.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.deliveryLinkHint")}
                </p>
              </>
            ) : null}

            {editingUser.role === "Depot" ? (
              <>
                <label className="form-label" htmlFor="user-edit-depot">{t("users.linkedDepot")}</label>
                <select
                  id="user-edit-depot"
                  value={editingUser.depotId || ""}
                  onChange={(event) => setEditingUser({ ...editingUser, depotId: event.target.value })}
                >
                  <option value="">{t("users.selectDepot")}</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {(d.name && String(d.name).trim()) || `Depot #${d.id}`} (#{d.id})
                    </option>
                  ))}
                </select>
                <p className="section-lead" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("users.depotLinkHint")}
                </p>
              </>
            ) : null}

            <div className="row-actions">
              <Button variant="primary" type="submit">{t("users.update")}</Button>
              <Button variant="ghost" tone="cancel" onClick={requestCancelEdit}>{t("users.cancel")}</Button>
            </div>
          </form>
        </div>
      ) : null}

    </section>
  );
}
