import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import "./UsersPage.css";
import { ROLES } from "../services/adminApi";
import { ALL_MENU_KEYS, MENU_ITEMS } from "../constants/menus";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

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

const EMPTY_EDIT = {
  id: "",
  name: "",
  username: "",
  password: "",
  role: "Owner",
  isActive: true,
  customerId: "",
  deliveryAgentId: "",
  initialRole: "Owner",
  initialCustomerId: "",
  initialDeliveryAgentId: "",
};

const EMPTY_NEW = {
  name: "",
  username: "",
  password: "",
  role: "Owner",
  customerId: "",
  deliveryAgentId: "",
};

export function UsersPage({
  users = [],
  customers = [],
  deliveryAgents = [],
  currentUser,
  newUser,
  setNewUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  roleMenusByRole = null,
  onSaveRoleMenus,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [editingUser, setEditingUser] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingUser.id), [editingUser.id]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuRole, setMenuRole] = useState("Owner");
  const [menuDraft, setMenuDraft] = useState(() => new Set(ALL_MENU_KEYS));
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const filteredUsers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((entry) =>
      [
        entry.id,
        entry.name,
        entry.username,
        entry.role,
        entry.customerId,
        linkedCustomerLabel(customers, entry.customerId),
        entry.deliveryAgentId,
        linkedDeliveryAgentLabel(deliveryAgents, entry.deliveryAgentId),
        entry.isActive ? t("users.active") : t("users.inactive"),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [users, customers, deliveryAgents, appliedSearch, t]);
  const {
    page,
    pageSize,
    paged: pagedUsers,
    setPage,
    setPageSize,
  } = usePagination(filteredUsers, { resetKey: appliedSearch });
  useEffect(() => {
    if (!roleMenusByRole) return;
    const keys = roleMenusByRole[menuRole];
    const base =
      Array.isArray(keys) && keys.length
        ? keys
        : ALL_MENU_KEYS;
    const id = requestAnimationFrame(() => {
      setMenuDraft(new Set(base));
    });
    return () => cancelAnimationFrame(id);
  }, [roleMenusByRole, menuRole]);

  function closeCreateModal() {
    setCreateModalOpen(false);
  }

  function requestOpenCreateModal() {
    setNewUser(EMPTY_NEW);
    setCreateModalOpen(true);
  }

  function requestCloseCreateModal() {
    closeCreateModal();
  }

  async function submitCreate(event) {
    event.preventDefault();
    const ok = await onCreateUser(event);
    if (ok) {
      closeCreateModal();
    }
  }

  function toggleMenuKey(key) {
    setMenuDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function openMenuAccessModal() {
    setMenuModalOpen(true);
  }

  function requestCloseMenuModal() {
    setMenuModalOpen(false);
  }

  async function saveRoleMenus(event) {
    event.preventDefault();
    if (!onSaveRoleMenus) return;
    const keys = Array.from(menuDraft);
    const ok = await onSaveRoleMenus(menuRole, keys.sort());
    if (ok) {
      setMenuModalOpen(false);
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
      initialRole: role,
      initialCustomerId: user.customerId || "",
      initialDeliveryAgentId: user.deliveryAgentId || "",
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
          {roleMenusByRole ? (
            <Button variant="ghost" onClick={openMenuAccessModal}>
              {t("users.configureMenus")}
            </Button>
          ) : null}
        </div>
      </div>

      <section className="panel entity-list">
        <h3>{t("users.listTitle")}</h3>
        {users.length === 0 ? (
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
                    <td>{user.isActive ? t("users.active") : t("users.inactive")}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" tone="edit" onClick={() => startEdit(user)}>
                          {t("users.edit")}
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

            <label className="form-label" htmlFor="user-username">{t("users.username")}</label>
            <input id="user-username" value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} required minLength={3} />

            <label className="form-label" htmlFor="user-password">{t("users.password")}</label>
            <input id="user-password" type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required minLength={6} />

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
                }));
              }}
              required
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            <label className="form-label" htmlFor="user-create-customer">{t("users.linkedCustomer")}</label>
            <select
              id="user-create-customer"
              value={newUser.customerId || ""}
              disabled={newUser.role !== "Customer"}
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
              {newUser.role === "Customer" ? t("users.customerLinkHint") : t("users.linkedCustomerRoleHint")}
            </p>

            <label className="form-label" htmlFor="user-create-delivery-agent">
              {t("users.linkedDeliveryAgent")}
            </label>
            <select
              id="user-create-delivery-agent"
              value={newUser.deliveryAgentId || ""}
              disabled={newUser.role !== "Delivery"}
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
              {newUser.role === "Delivery" ? t("users.deliveryLinkHint") : t("users.linkedDeliveryAgentRoleHint")}
            </p>

            <div className="row-actions">
              <Button variant="primary" type="submit">{t("users.save")}</Button>
              <Button variant="ghost" tone="cancel" onClick={requestCloseCreateModal}>{t("users.cancel")}</Button>
            </div>
          </form>
        </div>
      ) : null}

      {menuModalOpen && roleMenusByRole ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCloseMenuModal}
        >
          <form
            className="panel form menu-access-form modal-card modal-card--menu-access"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-menus-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveRoleMenus}
          >
            <div className="menu-access-modal__header">
              <h3 id="user-menus-title" className="menu-access-modal__title">
                {t("users.roleMenusTitle")}
              </h3>
              <p className="menu-access-modal__lead">{t("users.roleMenusLead")}</p>
            </div>

            <div className="menu-access-modal__role">
              <label className="menu-access-modal__role-label" htmlFor="menu-role">
                {t("users.roleMenusSelectRole")}
              </label>
              <select
                id="menu-role"
                className="menu-access-modal__select"
                value={menuRole}
                onChange={(event) => setMenuRole(event.target.value)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`, { defaultValue: role })}
                  </option>
                ))}
              </select>
            </div>

            <div className="menu-access-modal__body">
              <p className="menu-access-modal__section-label">{t("users.roleMenusSectionLabel")}</p>
              <div className="menu-access-grid" role="group" aria-label={t("users.roleMenusSectionLabel")}>
                {MENU_ITEMS.map((item) => {
                  const on = menuDraft.has(item.key);
                  return (
                    <label
                      key={item.key}
                      className={
                        "menu-access-item" +
                        (on ? " menu-access-item--on" : "")
                      }
                    >
                      <span className="menu-access-item__check">
                        <input
                          type="checkbox"
                          className="menu-access-item__input"
                          checked={on}
                          onChange={() => toggleMenuKey(item.key)}
                        />
                        <span className="menu-access-item__box" aria-hidden />
                      </span>
                      <span className="menu-access-item__content">
                        <span className="menu-access-item__row">
                          <span className="menu-access-item__title">{t(item.labelKey)}</span>
                        </span>
                        <span className="menu-access-item__sub">{t(item.subKey)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="menu-access-modal__footer">
              <Button variant="ghost" tone="cancel" onClick={requestCloseMenuModal}>
                {t("users.cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {t("users.roleMenusSave")}
              </Button>
            </div>
          </form>
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
                }));
              }}
              required
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            <label className="form-label" htmlFor="user-edit-customer">{t("users.linkedCustomer")}</label>
            <select
              id="user-edit-customer"
              value={editingUser.customerId || ""}
              disabled={editingUser.role !== "Customer"}
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
              {editingUser.role === "Customer" ? t("users.customerLinkHint") : t("users.linkedCustomerRoleHint")}
            </p>

            <label className="form-label" htmlFor="user-edit-delivery-agent">
              {t("users.linkedDeliveryAgent")}
            </label>
            <select
              id="user-edit-delivery-agent"
              value={editingUser.deliveryAgentId || ""}
              disabled={editingUser.role !== "Delivery"}
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
              {editingUser.role === "Delivery" ? t("users.deliveryLinkHint") : t("users.linkedDeliveryAgentRoleHint")}
            </p>

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
