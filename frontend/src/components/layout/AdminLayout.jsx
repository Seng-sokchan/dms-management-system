import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useConfirm } from "../ui/ConfirmProvider";
import { Button } from "../ui/Button";
import { MENU_ITEMS } from "../../constants/menus";
import "./AdminLayout.css";

/* ── Page title map ── */
const PAGE_PATH_MAP = {
  "/overview":        "overview",
  "/create-order":    "newOrder",
  "/catalogs":        "catalogs",
  "/items":           "items",
  "/addresses":       "addresses",
  "/customers":       "customers",
  "/borrowed-materials": "borrowedMaterials",
  "/depots":          "depots",
  "/producers":       "producers",
  "/delivery-agents": "deliveryAgents",
  "/trucks":          "trucks",
  "/orders":          "orders",
  "/assign-orders":   "assignOrders",
  "/order-movement":  "orderMovement",
  "/payments":        "payments",
  "/users":           "users",
};

/* ── SVG icons keyed by menu key ── */
const NAV_ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  newOrder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8"  y1="12" x2="16" y2="12" />
    </svg>
  ),
  catalogs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  ),
  items: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  addresses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  borrowedMaterials: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  depots: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
  producers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7H3l2-4h14l2 4" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  deliveryAgents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  trucks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1.5" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5"  cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9"  y1="12" x2="15" y2="12" />
      <line x1="9"  y1="16" x2="13" y2="16" />
    </svg>
  ),
  assignOrders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h3" />
      <path d="M9 12h4M9 16h3" />
      <rect x="14" y="8" width="7" height="5" rx="1" />
      <path d="M21 11h1.5l1 2v2h-2.5V11z" />
      <circle cx="16" cy="17" r="1.5" />
      <circle cx="20" cy="17" r="1.5" />
    </svg>
  ),
  orderMovement: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3h4v4" />
      <path d="M3 7V3h4" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
      <path d="M7 21H3v-4" />
      <path d="M21 17v4h-4" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  ),
};

/* ── Logo mark ── */
function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 2V18M2 6.5L18 13.5M18 6.5L2 13.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
    </svg>
  );
}

function navItemClassName({ isActive }) {
  return isActive ? "admin-nav-item is-active" : "admin-nav-item";
}

function roleLabel(t, role) {
  if (!role) return "";
  return t(`roles.${role}`, { defaultValue: role });
}

/* ── Sidebar groups ── */
const NAV_GROUPS = [
  { labelKey: null, keys: ["overview"] },
  {
    labelKey: "nav.sectionOrders",
    defaultLabel: "Orders",
    keys: ["newOrder", "catalogs", "items", "addresses", "customers", "borrowedMaterials", "depots", "producers", "orders", "assignOrders", "orderMovement", "payments"],
  },
  {
    labelKey: "nav.sectionFulfillment",
    defaultLabel: "Fulfillment",
    keys: ["deliveryAgents", "trucks"],
  },
  {
    labelKey: "nav.sectionAdmin",
    defaultLabel: "Admin",
    keys: ["users"],
  },
];

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
    if (user?.role === "Admin") return MENU_ITEMS;
    const allowed = user?.allowedMenus;
    if (!Array.isArray(allowed)) return MENU_ITEMS;
    if (allowed.length === 0) return [];
    return MENU_ITEMS.filter((item) => {
      if (item.key === "orderMovement") {
        return allowed.includes("orderMovement") || allowed.includes("orders");
      }
      return allowed.includes(item.key);
    });
  }, [user?.role, user?.allowedMenus]);

  const visibleKeySet = useMemo(
    () => new Set(visibleNav.map((i) => i.key)),
    [visibleNav],
  );

  const itemByKey = useMemo(
    () => Object.fromEntries(MENU_ITEMS.map((i) => [i.key, i])),
    [],
  );

  useEffect(() => {
    if (!flash?.text || flash.variant !== "success") return;
    const id = setTimeout(() => onFlashDismiss?.(), 5000);
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
      {/* Backdrop */}
      <div
        className={`admin-sidebar-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />

      {/* ── Sidebar ── */}
      <aside
        className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label={t("a11y.mainNav")}
      >
        <div className="admin-sidebar-brand">
          <div className="admin-logo">
            <div className="admin-logo-mark">
              <LogoIcon />
            </div>
            {t("app.name")}
          </div>
          <p className="admin-sidebar-tagline">{t("app.tagline")}</p>
        </div>

        <nav className="admin-nav">
          {NAV_GROUPS.map((group, gi) => {
            const groupItems = group.keys
              .map((k) => itemByKey[k])
              .filter((item) => item && visibleKeySet.has(item.key));

            if (groupItems.length === 0) return null;

            return (
              <div key={gi}>
                {gi > 0 && <div className="admin-nav-divider" />}
                {group.labelKey && (
                  <p className="admin-nav-section-label">
                    {t(group.labelKey, { defaultValue: group.defaultLabel })}
                  </p>
                )}
                {groupItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={navItemClassName}
                    end
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="admin-nav-icon" aria-hidden>
                      {NAV_ICONS[item.key] ?? NAV_ICONS.orders}
                    </span>
                    <span className="admin-nav-text">
                      <span className="admin-nav-label">{t(item.labelKey)}</span>
                      <span className="admin-nav-sub">{t(item.subKey)}</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-footnote">{t("app.footer")}</p>
        </div>
      </aside>

      {/* ── Main ── */}
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
            <h1 className="admin-page-title">{pageHead.title}</h1>
          </div>

          <div className="admin-topbar-right">
            <LanguageSwitcher className="lang-switcher--topbar" />
            <div className="admin-user" title={`${user?.name} · ${user?.role}`}>
              <div className="admin-user-avatar" aria-hidden>
                {user?.name
                  ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?"}
              </div>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user?.name || "—"}</span>
                <span className="admin-user-role">{roleLabel(t, user?.role)}</span>
              </div>
            </div>
            <Button variant="ghost" onClick={() => void handleLogout()}>
              {t("auth.signOut")}
            </Button>
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
              ) : (
                <span className="admin-flash__icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8"  x2="12"    y2="12"    />
                    <line x1="12" y1="16" x2="12.01" y2="16.01" />
                  </svg>
                </span>
              )}
              <span className="admin-flash__text">{flash.text}</span>
            </div>
          ) : null}
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
