import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROLES } from "../services/adminApi";
import { fetchBakongTokenStatus, saveBakongToken } from "../services/adminApi/payments";
import { ALL_MENU_KEYS, MENU_ITEMS } from "../constants/menus";
import { useConfirm } from "../components/ui/ConfirmProvider";

const EMPTY_EDIT = { id: "", name: "", username: "", password: "", role: "Owner", isActive: true };

const EMPTY_NEW = { name: "", username: "", password: "", role: "Owner" };

export function UsersPage({
  token,
  users = [],
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
  const { confirm, alert } = useConfirm();
  const [editingUser, setEditingUser] = useState(EMPTY_EDIT);
  const isEditing = useMemo(() => Boolean(editingUser.id), [editingUser.id]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuRole, setMenuRole] = useState("Owner");
  const [menuDraft, setMenuDraft] = useState(() => new Set(ALL_MENU_KEYS));
  const [bakongTokenModalOpen, setBakongTokenModalOpen] = useState(false);
  const [newBakongToken, setNewBakongToken] = useState("");
  const [bakongTokenMeta, setBakongTokenMeta] = useState(null);
  const [bakongTokenSaving, setBakongTokenSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetchBakongTokenStatus(token)
      .then((data) => {
        if (!cancelled) setBakongTokenMeta(data);
      })
      .catch(() => {
        if (!cancelled) setBakongTokenMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSaveBakongToken(event) {
    event.preventDefault();
    const value = newBakongToken.trim();
    if (!value) return;
    setBakongTokenSaving(true);
    try {
      const response = await saveBakongToken(token, value);
      const data = response?.data || response;
      setBakongTokenMeta({
        hasToken: true,
        expiresAt: data?.expiresAt,
        updatedAt: data?.updatedAt,
      });
      setNewBakongToken("");
      setBakongTokenModalOpen(false);
      await alert({
        title: t("confirm.successTitle"),
        message: t("payments.bakongTokenSaved"),
        tone: "primary",
      });
    } catch (error) {
      await alert({
        title: t("confirm.defaultTitle"),
        message: error?.response?.data?.message || error?.message || t("errors.saveBakongToken"),
        tone: "danger",
      });
    } finally {
      setBakongTokenSaving(false);
    }
  }

  useEffect(() => {
    if (!roleMenusByRole) return;
    const keys = roleMenusByRole[menuRole];
    const base =
      Array.isArray(keys) && keys.length
        ? keys
        : ALL_MENU_KEYS;
    setMenuDraft(new Set(base));
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
    setEditingUser({
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: user.role || "Owner",
      isActive: user.isActive !== false,
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
          {bakongTokenMeta?.hasToken ? (
            <p className="section-lead section-lead--meta">
              {t("payments.bakongTokenStatus", {
                expires: bakongTokenMeta.expiresAt
                  ? new Date(bakongTokenMeta.expiresAt).toLocaleString()
                  : t("payments.bakongTokenExpiresUnknown"),
              })}
            </p>
          ) : (
            <p className="section-lead section-lead--meta admin-flash--error">
              {t("payments.bakongTokenMissing")}
            </p>
          )}
        </div>
        <div className="section-heading-actions">
          <button type="button" className="btn-primary" onClick={requestOpenCreateModal}>
            {t("users.addUser")}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setBakongTokenModalOpen(true)}>
            {t("payments.bakongTokenButton")}
          </button>
          {roleMenusByRole ? (
            <button type="button" className="btn-ghost" onClick={openMenuAccessModal}>
              {t("users.configureMenus")}
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel entity-list">
        <h3>{t("users.listTitle")}</h3>
        {users.length === 0 ? (
          <p className="entity-list-empty">{t("users.empty")}</p>
        ) : (
          <ul className="entity-list-ul">
            {users.map((user) => (
              <li key={user.id} className="entity-list-item">
                <span className="entity-list-name">{user.name}</span>
                <span className="entity-list-meta">@{user.username}</span>
                <span className="entity-list-meta">{t(`roles.${user.role}`, { defaultValue: user.role })}</span>
                <span className="entity-list-meta">{user.isActive ? t("users.active") : t("users.inactive")}</span>
                <div className="row-actions">
                  <button type="button" className="btn-ghost btn-edit" onClick={() => startEdit(user)}>
                    {t("users.edit")}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-delete"
                    onClick={() => void handleDelete(user.id)}
                    disabled={currentUser?.id === user.id || !user.isActive}
                  >
                    {t("users.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
            <select id="user-role" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} required>
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("users.save")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={requestCloseCreateModal}>{t("users.cancel")}</button>
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
              <button type="button" className="btn-ghost btn-cancel" onClick={requestCloseMenuModal}>
                {t("users.cancel")}
              </button>
              <button type="submit" className="btn-primary">
                {t("users.roleMenusSave")}
              </button>
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
            <select id="user-edit-role" value={editingUser.role} onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })} required>
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`roles.${role}`, { defaultValue: role })}</option>
              ))}
            </select>

            <div className="row-actions">
              <button type="submit" className="btn-primary">{t("users.update")}</button>
              <button type="button" className="btn-ghost btn-cancel" onClick={requestCancelEdit}>{t("users.cancel")}</button>
            </div>
          </form>
        </div>
      ) : null}

      {bakongTokenModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => !bakongTokenSaving && setBakongTokenModalOpen(false)}
        >
          <form
            className="panel form modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bakong-token-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveBakongToken}
          >
            <h3 id="bakong-token-title">{t("payments.bakongTokenModalTitle")}</h3>
            <p className="section-lead">{t("payments.bakongTokenModalLead")}</p>
            <label className="form-label" htmlFor="bakong-access-token">{t("payments.bakongTokenLabel")}</label>
            <textarea
              id="bakong-access-token"
              rows={4}
              value={newBakongToken}
              onChange={(e) => setNewBakongToken(e.target.value)}
              placeholder={t("payments.bakongTokenPlaceholder")}
              required
              autoFocus
            />
            <div className="row-actions">
              <button type="submit" className="btn-primary" disabled={bakongTokenSaving}>
                {bakongTokenSaving ? t("common.loading", { defaultValue: "Loading..." }) : t("payments.bakongTokenSave")}
              </button>
              <button
                type="button"
                className="btn-ghost btn-cancel"
                disabled={bakongTokenSaving}
                onClick={() => setBakongTokenModalOpen(false)}
              >
                {t("users.cancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
