import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePagination } from "../hooks/usePagination";
import "./UsersPage.css";
import { ALL_MENU_KEYS, MENU_ITEMS } from "../constants/menus";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { useConfirm } from "../components/ui/ConfirmProvider";

const FALLBACK_ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];
const DATA_SCOPES = ["all", "owner", "depot", "customer", "delivery_agent", "none"];
const CLIENT_OPTIONS = ["admin", "mobile"];
const STATUS_ACTIONS = ["update_status", "confirm_delivery"];
const SOCKET_CHANNELS = ["delivery-locations-watcher"];

function statusActionShortLabel(t, action) {
  return action === "confirm_delivery"
    ? t("users.statusPermActionConfirm")
    : t("users.statusPermActionUpdate");
}

function statusActionTitle(t, action) {
  return action === "confirm_delivery"
    ? t("users.statusPermLegendConfirm")
    : t("users.statusPermLegendUpdate");
}

const CLIENT_META = {
  admin: { labelKey: "users.clientAdmin", descKey: "users.clientAdminDesc" },
  mobile: { labelKey: "users.clientMobile", descKey: "users.clientMobileDesc" },
};

const SOCKET_CHANNEL_META = {
  "delivery-locations-watcher": {
    labelKey: "users.socketChannelDeliveryLocations",
    descKey: "users.socketChannelDeliveryLocationsDesc",
  },
};

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
  roles = [],
  menuCatalog = [],
  statuses = [],
  statusTransitionsByStatus = null,
  roleAccessByRole = null,
  roleStatusPermissionsByRole = null,
  mobileMenuCatalog = [],
  onSaveRoleMenus,
  onSaveStatusTransitions,
  onSaveRoleAccess,
  onSaveRoleStatusPermissions,
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [editingUser, setEditingUser] = useState(EMPTY_EDIT);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [statusPermsModalOpen, setStatusPermsModalOpen] = useState(false);
  const [menuClient, setMenuClient] = useState("admin");
  const [menuRole, setMenuRole] = useState("Owner");
  const [menuDraft, setMenuDraft] = useState(() => new Set(ALL_MENU_KEYS));
  const [workflowDraft, setWorkflowDraft] = useState(() => ({}));
  const [accessRole, setAccessRole] = useState("Owner");
  const [accessDraft, setAccessDraft] = useState({
    dataScope: "none",
    clients: [],
    socketChannels: [],
  });
  const [statusPermsDraft, setStatusPermsDraft] = useState({});
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const roleNames = useMemo(() => {
    const fromApi = Array.isArray(roles) ? roles.map((row) => row.name).filter(Boolean) : [];
    return fromApi.length ? fromApi : FALLBACK_ROLES;
  }, [roles]);
  const accessibleMenuItems = useMemo(() => {
    const keys = new Set(
      Array.isArray(menuCatalog) && menuCatalog.length
        ? menuCatalog.map((row) => row.menuKey)
        : ALL_MENU_KEYS,
    );
    return MENU_ITEMS.filter((item) => keys.has(item.key));
  }, [menuCatalog]);
  const mobileMenuItems = useMemo(() => {
    const rows = Array.isArray(mobileMenuCatalog) ? mobileMenuCatalog : [];
    return rows.map((row) => ({
      key: row.menuKey,
      label: row.menuKey,
    }));
  }, [mobileMenuCatalog]);
  const menuItemsForClient = useMemo(() => {
    if (menuClient === "mobile") return mobileMenuItems;
    return accessibleMenuItems.map((item) => ({ key: item.key, label: t(item.labelKey) }));
  }, [menuClient, mobileMenuItems, accessibleMenuItems, t]);
  const orderedStatuses = useMemo(() => {
    if (!Array.isArray(statuses) || !statuses.length) return [];
    return [...statuses].sort((a, b) => {
      const aOrder = Number(a.sortOrder ?? a.id ?? 0);
      const bOrder = Number(b.sortOrder ?? b.id ?? 0);
      return aOrder - bOrder;
    });
  }, [statuses]);
  const isEditing = useMemo(() => Boolean(editingUser.id), [editingUser.id]);
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
    if (!roleNames.includes(menuRole)) {
      setMenuRole(roleNames[0] || "Owner");
    }
  }, [roleNames, menuRole]);

  useEffect(() => {
    if (!roleMenusByRole) return;
    const keys = roleMenusByRole[menuRole] || [];
    const isMobileKey = (key) => String(key).startsWith("mobile.");
    const base = keys.filter((key) => (menuClient === "mobile" ? isMobileKey(key) : !isMobileKey(key)));
    const fallback = menuItemsForClient.map((item) => item.key);
    const id = requestAnimationFrame(() => {
      setMenuDraft(new Set(base.length ? base : fallback));
    });
    return () => cancelAnimationFrame(id);
  }, [roleMenusByRole, menuRole, menuClient, menuItemsForClient]);

  useEffect(() => {
    if (!roleAccessByRole) return;
    const row = roleAccessByRole[accessRole];
    const id = requestAnimationFrame(() => {
      setAccessDraft({
        dataScope: row?.dataScope || "none",
        clients: Array.isArray(row?.clients) ? [...row.clients] : [],
        socketChannels: Array.isArray(row?.socketChannels) ? [...row.socketChannels] : [],
      });
    });
    return () => cancelAnimationFrame(id);
  }, [roleAccessByRole, accessRole]);

  useEffect(() => {
    if (!roleStatusPermissionsByRole) return;
    const id = requestAnimationFrame(() => {
      setStatusPermsDraft(
        JSON.parse(JSON.stringify(roleStatusPermissionsByRole)),
      );
    });
    return () => cancelAnimationFrame(id);
  }, [roleStatusPermissionsByRole]);

  useEffect(() => {
    if (!statusTransitionsByStatus || !orderedStatuses.length) return;
    const next = {};
    for (const row of orderedStatuses) {
      const allowed = statusTransitionsByStatus[row.name];
      next[row.name] = new Set(Array.isArray(allowed) ? allowed : []);
    }
    const id = requestAnimationFrame(() => {
      setWorkflowDraft(next);
    });
    return () => cancelAnimationFrame(id);
  }, [statusTransitionsByStatus, orderedStatuses]);

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

  function openWorkflowModal() {
    setWorkflowModalOpen(true);
  }

  function requestCloseWorkflowModal() {
    setWorkflowModalOpen(false);
  }

  function toggleWorkflowTransition(fromStatus, toStatus) {
    setWorkflowDraft((prev) => {
      const next = { ...prev };
      const current = new Set(next[fromStatus] || []);
      if (current.has(toStatus)) {
        current.delete(toStatus);
      } else {
        current.add(toStatus);
      }
      next[fromStatus] = current;
      return next;
    });
  }

  async function saveStatusWorkflow(event) {
    event.preventDefault();
    if (!onSaveStatusTransitions || !orderedStatuses.length) return;
    const transitions = orderedStatuses.map((row) => ({
      fromStatus: row.name,
      toStatuses: Array.from(workflowDraft[row.name] || []).sort(),
    }));
    const ok = await onSaveStatusTransitions(transitions);
    if (ok) {
      setWorkflowModalOpen(false);
    }
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
    const current = roleMenusByRole?.[menuRole] || [];
    const isMobileKey = (key) => String(key).startsWith("mobile.");
    const otherKeys = current.filter((key) => (menuClient === "mobile" ? !isMobileKey(key) : isMobileKey(key)));
    const keys = [...otherKeys, ...Array.from(menuDraft)];
    const ok = await onSaveRoleMenus(menuRole, keys.sort());
    if (ok) {
      setMenuModalOpen(false);
    }
  }

  function toggleAccessClient(client) {
    setAccessDraft((prev) => {
      const next = new Set(prev.clients);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return { ...prev, clients: [...next] };
    });
  }

  function toggleSocketChannel(channel) {
    setAccessDraft((prev) => {
      const next = new Set(prev.socketChannels);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return { ...prev, socketChannels: [...next] };
    });
  }

  async function saveRoleAccessForm(event) {
    event.preventDefault();
    if (!onSaveRoleAccess) return;
    const ok = await onSaveRoleAccess(accessRole, accessDraft);
    if (ok) setAccessModalOpen(false);
  }

  function openAccessModal() {
    setAccessModalOpen(true);
  }

  function requestCloseAccessModal() {
    setAccessModalOpen(false);
  }

  function setAccessDataScope(scope) {
    setAccessDraft((prev) => ({ ...prev, dataScope: scope }));
  }

  function toggleStatusPermission(roleName, statusName, action) {
    setStatusPermsDraft((prev) => {
      const next = { ...prev };
      const rolePerms = { ...(next[roleName] || {}) };
      const actions = new Set(Array.isArray(rolePerms[statusName]) ? rolePerms[statusName] : []);
      if (actions.has(action)) actions.delete(action);
      else actions.add(action);
      rolePerms[statusName] = [...actions];
      next[roleName] = rolePerms;
      return next;
    });
  }

  function requestCloseStatusPermsModal() {
    setStatusPermsModalOpen(false);
  }

  async function saveStatusPermissionsForm(event) {
    event.preventDefault();
    if (!onSaveRoleStatusPermissions) return;
    const ok = await onSaveRoleStatusPermissions(statusPermsDraft);
    if (ok) setStatusPermsModalOpen(false);
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
          {statusTransitionsByStatus && orderedStatuses.length ? (
            <Button variant="ghost" onClick={openWorkflowModal}>
              {t("users.configureStatusWorkflow")}
            </Button>
          ) : null}
          {roleAccessByRole ? (
            <Button variant="ghost" onClick={openAccessModal}>
              {t("users.configureRoleAccess")}
            </Button>
          ) : null}
          {roleStatusPermissionsByRole ? (
            <Button variant="ghost" onClick={() => setStatusPermsModalOpen(true)}>
              {t("users.configureStatusPermissions")}
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
              {roleNames.map((role) => (
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
              <label className="menu-access-modal__role-label" htmlFor="menu-client">
                {t("users.menuClient")}
              </label>
              <select
                id="menu-client"
                className="menu-access-modal__select"
                value={menuClient}
                onChange={(event) => setMenuClient(event.target.value)}
              >
                <option value="admin">{t("users.clientAdmin")}</option>
                <option value="mobile">{t("users.clientMobile")}</option>
              </select>
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
                {roleNames.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`, { defaultValue: role })}
                  </option>
                ))}
              </select>
            </div>

            <div className="menu-access-modal__body">
              <p className="menu-access-modal__section-label">{t("users.roleMenusSectionLabel")}</p>
              <div className="menu-access-grid" role="group" aria-label={t("users.roleMenusSectionLabel")}>
                {menuItemsForClient.map((item) => {
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
                          <span className="menu-access-item__title">{item.label || item.key}</span>
                        </span>
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

      {accessModalOpen && roleAccessByRole ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCloseAccessModal}
        >
          <form
            className="panel form menu-access-form modal-card modal-card--role-access"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-access-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveRoleAccessForm}
          >
            <div className="menu-access-modal__header">
              <h3 id="role-access-title" className="menu-access-modal__title">
                {t("users.roleAccessTitle")}
              </h3>
              <p className="menu-access-modal__lead">{t("users.roleAccessLead")}</p>
            </div>

            <div className="menu-access-modal__role">
              <label className="menu-access-modal__role-label" htmlFor="access-role">
                {t("users.roleMenusSelectRole")}
              </label>
              <select
                id="access-role"
                className="menu-access-modal__select"
                value={accessRole}
                onChange={(e) => setAccessRole(e.target.value)}
              >
                {roleNames.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`, { defaultValue: role })}
                  </option>
                ))}
              </select>
            </div>

            <div className="menu-access-modal__body role-access-modal__body">
              <section className="role-access-section">
                <p className="menu-access-modal__section-label">{t("users.dataScopeSectionLabel")}</p>
                <div className="role-access-scope-grid" role="radiogroup" aria-label={t("users.dataScopeSectionLabel")}>
                  {DATA_SCOPES.map((scope) => {
                    const selected = accessDraft.dataScope === scope;
                    return (
                      <label
                        key={scope}
                        className={"role-access-scope" + (selected ? " role-access-scope--on" : "")}
                      >
                        <input
                          type="radio"
                          className="role-access-scope__input"
                          name="access-data-scope"
                          value={scope}
                          checked={selected}
                          onChange={() => setAccessDataScope(scope)}
                        />
                        <span className="role-access-scope__marker" aria-hidden />
                        <span className="role-access-scope__content">
                          <span className="role-access-scope__title">
                            {t(`users.dataScope.${scope}.label`, { defaultValue: scope })}
                          </span>
                          <span className="role-access-scope__desc">
                            {t(`users.dataScope.${scope}.desc`, { defaultValue: "" })}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="role-access-section">
                <p className="menu-access-modal__section-label">{t("users.allowedClientsSectionLabel")}</p>
                <div className="menu-access-grid" role="group" aria-label={t("users.allowedClientsSectionLabel")}>
                  {CLIENT_OPTIONS.map((client) => {
                    const meta = CLIENT_META[client] || {};
                    const on = accessDraft.clients.includes(client);
                    return (
                      <label
                        key={client}
                        className={"menu-access-item" + (on ? " menu-access-item--on" : "")}
                      >
                        <span className="menu-access-item__check">
                          <input
                            type="checkbox"
                            className="menu-access-item__input"
                            checked={on}
                            onChange={() => toggleAccessClient(client)}
                          />
                          <span className="menu-access-item__box" aria-hidden />
                        </span>
                        <span className="menu-access-item__content">
                          <span className="menu-access-item__row">
                            <span className="menu-access-item__title">
                              {t(meta.labelKey || client, { defaultValue: client })}
                            </span>
                            <span className="menu-access-item__badge">{client}</span>
                          </span>
                          {meta.descKey ? (
                            <span className="menu-access-item__sub">{t(meta.descKey)}</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="role-access-section">
                <p className="menu-access-modal__section-label">{t("users.socketChannelsSectionLabel")}</p>
                <div className="menu-access-grid" role="group" aria-label={t("users.socketChannelsSectionLabel")}>
                  {SOCKET_CHANNELS.map((channel) => {
                    const meta = SOCKET_CHANNEL_META[channel] || {};
                    const on = accessDraft.socketChannels.includes(channel);
                    return (
                      <label
                        key={channel}
                        className={"menu-access-item" + (on ? " menu-access-item--on" : "")}
                      >
                        <span className="menu-access-item__check">
                          <input
                            type="checkbox"
                            className="menu-access-item__input"
                            checked={on}
                            onChange={() => toggleSocketChannel(channel)}
                          />
                          <span className="menu-access-item__box" aria-hidden />
                        </span>
                        <span className="menu-access-item__content">
                          <span className="menu-access-item__row">
                            <span className="menu-access-item__title">
                              {t(meta.labelKey || channel, { defaultValue: channel })}
                            </span>
                          </span>
                          {meta.descKey ? (
                            <span className="menu-access-item__sub">{t(meta.descKey)}</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="menu-access-modal__footer">
              <Button variant="ghost" tone="cancel" type="button" onClick={requestCloseAccessModal}>
                {t("users.cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {t("users.roleAccessSave")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {statusPermsModalOpen && roleStatusPermissionsByRole && orderedStatuses.length ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCloseStatusPermsModal}
        >
          <form
            className="panel form menu-access-form modal-card modal-card--status-perms"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-perms-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveStatusPermissionsForm}
          >
            <div className="menu-access-modal__header">
              <h3 id="status-perms-title" className="menu-access-modal__title">
                {t("users.statusPermissionsTitle")}
              </h3>
              <p className="menu-access-modal__lead">{t("users.statusPermissionsLead")}</p>
            </div>

            <div className="status-perms-legend" role="note">
              {STATUS_ACTIONS.map((action) => (
                <div key={action} className="status-perms-legend__item">
                  <span
                    className={
                      "status-perms-legend__chip" +
                      (action === "confirm_delivery"
                        ? " status-perms-legend__chip--confirm"
                        : " status-perms-legend__chip--update")
                    }
                    aria-hidden
                  >
                    {statusActionShortLabel(t, action)}
                  </span>
                  <span className="status-perms-legend__text">{statusActionTitle(t, action)}</span>
                </div>
              ))}
            </div>

            <div className="menu-access-modal__body status-perms-modal__body">
              <div className="status-perms-table-wrap">
                <table className="status-perms-table">
                  <thead>
                    <tr>
                      <th scope="col" className="status-perms-table__corner">
                        {t("users.statusPermRoleColumn")}
                      </th>
                      {orderedStatuses.map((status, index) => (
                        <th
                          key={status.name}
                          scope="colgroup"
                          colSpan={STATUS_ACTIONS.length}
                          className="status-perms-table__status"
                          title={t(`enums.orderStatus.${status.name}`, { defaultValue: status.name })}
                        >
                          <span className="status-perms-table__step">{index + 1}</span>
                          <span className="status-perms-table__status-name">
                            {t(`enums.orderStatus.${status.name}`, { defaultValue: status.name })}
                          </span>
                        </th>
                      ))}
                    </tr>
                    <tr className="status-perms-table__action-row">
                      <th scope="col" className="status-perms-table__corner status-perms-table__corner--sub" />
                      {orderedStatuses.map((status) =>
                        STATUS_ACTIONS.map((action) => (
                          <th
                            key={`${status.name}-${action}`}
                            scope="col"
                            className={
                              "status-perms-table__action" +
                              (action === "confirm_delivery"
                                ? " status-perms-table__action--confirm"
                                : " status-perms-table__action--update")
                            }
                            title={statusActionTitle(t, action)}
                          >
                            {statusActionShortLabel(t, action)}
                          </th>
                        )),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {roleNames.map((roleName) => (
                      <tr key={roleName}>
                        <th scope="row" className="status-perms-table__role">
                          {t(`roles.${roleName}`, { defaultValue: roleName })}
                        </th>
                        {orderedStatuses.map((status) =>
                          STATUS_ACTIONS.map((action) => {
                            const on = (statusPermsDraft[roleName]?.[status.name] || []).includes(action);
                            const statusLabel = t(`enums.orderStatus.${status.name}`, {
                              defaultValue: status.name,
                            });
                            const roleLabel = t(`roles.${roleName}`, { defaultValue: roleName });
                            return (
                              <td key={`${roleName}-${status.name}-${action}`} className="status-perms-table__cell">
                                <button
                                  type="button"
                                  className={
                                    "status-perms-chip" +
                                    (on ? " status-perms-chip--on" : "") +
                                    (action === "confirm_delivery"
                                      ? " status-perms-chip--confirm"
                                      : " status-perms-chip--update")
                                  }
                                  aria-pressed={on}
                                  aria-label={t("users.statusPermToggleAria", {
                                    role: roleLabel,
                                    status: statusLabel,
                                    action: statusActionShortLabel(t, action),
                                  })}
                                  title={statusActionTitle(t, action)}
                                  onClick={() => toggleStatusPermission(roleName, status.name, action)}
                                >
                                  <span className="status-perms-chip__mark" aria-hidden />
                                  <span className="status-perms-chip__label">
                                    {statusActionShortLabel(t, action)}
                                  </span>
                                </button>
                              </td>
                            );
                          }),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="menu-access-modal__footer">
              <Button variant="ghost" tone="cancel" type="button" onClick={requestCloseStatusPermsModal}>
                {t("users.cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {t("users.statusPermissionsSave")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {workflowModalOpen && statusTransitionsByStatus && orderedStatuses.length ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={requestCloseWorkflowModal}
        >
          <form
            className="panel form menu-access-form modal-card modal-card--menu-access"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-workflow-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveStatusWorkflow}
          >
            <div className="menu-access-modal__header">
              <h3 id="status-workflow-title" className="menu-access-modal__title">
                {t("users.statusWorkflowTitle")}
              </h3>
              <p className="menu-access-modal__lead">{t("users.statusWorkflowLead")}</p>
            </div>

            <div className="menu-access-modal__body">
              {orderedStatuses.map((row) => (
                <section key={row.name} className="status-workflow-row">
                  <p className="menu-access-modal__section-label">
                    {t(`enums.orderStatus.${row.name}`, { defaultValue: row.name })}
                  </p>
                  <div className="menu-access-grid" role="group" aria-label={row.name}>
                    {orderedStatuses
                      .filter((target) => target.name !== row.name)
                      .map((target) => {
                        const on = workflowDraft[row.name]?.has(target.name);
                        return (
                          <label
                            key={`${row.name}-${target.name}`}
                            className={"menu-access-item" + (on ? " menu-access-item--on" : "")}
                          >
                            <span className="menu-access-item__check">
                              <input
                                type="checkbox"
                                className="menu-access-item__input"
                                checked={Boolean(on)}
                                onChange={() => toggleWorkflowTransition(row.name, target.name)}
                              />
                              <span className="menu-access-item__box" aria-hidden />
                            </span>
                            <span className="menu-access-item__content">
                              <span className="menu-access-item__title">
                                {t(`enums.orderStatus.${target.name}`, { defaultValue: target.name })}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>

            <div className="menu-access-modal__footer">
              <Button variant="ghost" tone="cancel" onClick={requestCloseWorkflowModal}>
                {t("users.cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {t("users.statusWorkflowSave")}
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
              {roleNames.map((role) => (
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
