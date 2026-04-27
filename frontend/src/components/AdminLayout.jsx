import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useConfirm } from "./ConfirmProvider";
import { MENU_ITEMS } from "../constants/menus";

const PAGE_PATH_MAP = {
  "/overview": "overview",
  "/create-order": "newOrder",
  "/catalogs": "catalogs",
  "/items": "items",
  "/customers": "customers",
  "/producers": "producers",
  "/delivery-agents": "deliveryAgents",
  "/orders": "orders",
  "/customer-orders": "customerOrders",
  "/owner-preparing": "ownerPreparing",
  "/confirm-orders": "confirmOrders",
  "/payments": "payments",
  "/users": "users",
  "/activity-logs": "activityLogs",
};

function navItemClassName({ isActive }) {
  return isActive ? "admin-nav-item is-active" : "admin-nav-item";
}

function roleLabel(t, role) {
  if (!role) return "";
  return t(`roles.${role}`, { defaultValue: role });
}

export function AdminLayout({ user, onLogout, flash, onFlashDismiss, children = null }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const pageHead = useMemo(() => {
    const key = PAGE_PATH_MAP[location.pathname];
    return { title: key ? t(`page.${key}`) : t("app.dashboard") };
  }, [location.pathname, t]);
  const visibleNav = useMemo(() => {
    if (user?.role === "Admin") {
      return MENU_ITEMS;
    }
    const allowed = user?.allowedMenus;
    if (!Array.isArray(allowed)) {
      return MENU_ITEMS;
    }
    if (allowed.length === 0) {
      return [];
    }
    return MENU_ITEMS.filter((item) => allowed.includes(item.key));
  }, [user?.role, user?.allowedMenus]);

  useEffect(() => {
    if (!flash?.text || flash.variant !== "success") return;
    const id = setTimeout(() => {
      onFlashDismiss?.();
    }, 5000);
    return () => clearTimeout(id);
  }, [flash, onFlashDismiss]);

  async function handleLogout() {
    if (
      !(await confirm({
        title: t("confirm.signOutTitle"),
        message: t("confirm.signOutMessage"),
        tone: "danger",
      }))
    ) {
      return;
    }
    onLogout();
  }

  return (
    <div className="admin-app">
      <div
        className={`admin-sidebar-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <aside
        className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label={t("a11y.mainNav")}
      >
        <div className="admin-sidebar-brand">
          <div className="admin-logo" aria-hidden>
            <span className="admin-logo-mark" />
            {t("app.name")}
          </div>
          <p className="admin-sidebar-tagline">{t("app.tagline")}</p>
        </div>
        <nav className="admin-nav">
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navItemClassName}
              end
              onClick={() => setMenuOpen(false)}
            >
              <span className="admin-nav-label">{t(item.labelKey)}</span>
              <span className="admin-nav-sub">{t(item.subKey)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-footnote">{t("app.footer")}</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={t("a11y.toggleMenu")}
            >
              <span className="admin-menu-icon" />
            </button>
            <div>
              <h1 className="admin-page-title">{pageHead.title}</h1>
            </div>
          </div>
          <div className="admin-topbar-right">
            <LanguageSwitcher className="lang-switcher--topbar" />
            <div className="admin-user" title={`${user?.name} · ${user?.role}`}>
              <div className="admin-user-avatar" aria-hidden>
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "?"}
              </div>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user?.name || "—"}</span>
                <span className="admin-user-role">{roleLabel(t, user?.role)}</span>
              </div>
            </div>
            <button type="button" className="btn-ghost" onClick={() => void handleLogout()}>
              {t("auth.signOut")}
            </button>
          </div>
        </header>
        <div className="admin-content">
          {flash?.text ? (
            <div
              className={`admin-flash admin-flash--${flash.variant}`}
              role="status"
            >
              {flash.variant === "success" ? (
                <span className="admin-flash__icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              ) : null}
              <span className="admin-flash__text">{flash.text}</span>
            </div>
          ) : null}
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
