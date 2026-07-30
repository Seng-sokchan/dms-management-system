import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useConfirm } from "../ui/ConfirmProvider";
import { Button } from "../ui/Button";
import { hasAdminPanelAccess, isMenuItemActive, MENU_ITEMS } from "../../constants/menus";
import "./AdminLayout.css";

/* ── Page title map ── */
const PAGE_PATH_MAP = {
  "/overview":        "overview",
  "/catalogs":        "catalogs",
  "/items":           "items",
  "/customer-item-prices": "customerItemPrices",
  "/depot-item-prices": "depotItemPrices",
  "/customers":       "customers",
  "/provinces":       "provinces",
  "/tracking-customer-location": "trackingCustomerLocation",
  "/borrowed-materials": "borrowedMaterials",
  "/depots":          "depots",
  "/customers-by-depot": "customersByDepot",
  "/producers":       "producers",
  "/delivery-agents": "deliveryAgents",
  "/orders":          "ordersAll",
  "/orders/by-province": "ordersByProvince",
  "/orders/by-delivery": "ordersByDelivery",
  "/assign-orders":   "assignOrders",
  "/payments":        "payments",
  "/customer-order-history": "customerOrderHistory",
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
  catalogs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  ),
  adminManagement: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.3.6.9 1.1 1.5 1.1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  ),
  items: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  userInformation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2.5" />
      <path d="M5.5 16.5c.8-1.8 2.4-3 4.5-3s3.7 1.2 4.5 3" />
      <line x1="14" y1="9" x2="18" y2="9" />
      <line x1="14" y1="13" x2="18" y2="13" />
    </svg>
  ),
  customerItemPrices: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  depotItemPrices: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
      <path d="M12 3v4" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  provinces: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  trackingCustomerLocation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
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
  customersByDepot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
      <circle cx="9" cy="12" r="1.75" />
      <circle cx="15" cy="12" r="1.75" />
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
  specialDay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 14l1.1 2.2 2.4.4-1.7 1.7.4 2.4L12 19.5 9.8 20.7l.4-2.4-1.7-1.7 2.4-.4L12 14z" />
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
  payments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  customerOrderHistory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
      <path d="M8 3h2M14 3h2" />
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
    <img
      src="/logo.png"
      alt=""
      width={36}
      height={36}
      className="admin-logo-img"
    />
  );
}

function navItemClassName({ isActive }) {
  return isActive ? "admin-nav-item is-active" : "admin-nav-item";
}

function roleLabel(t, role) {
  if (!role) return "";
  return t(`roles.${role}`, { defaultValue: role });
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`admin-nav-chevron ${open ? "is-open" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function NavItemWithChildren({ item, pathname, onNavigate, t }) {
  const routeActive = isMenuItemActive(item, pathname);
  const [openByUser, setOpenByUser] = useState(false);
  const expanded = routeActive || openByUser;

  return (
    <div className={`admin-nav-group ${expanded ? "is-expanded" : ""} ${routeActive ? "is-active" : ""}`}>
      <button
        type="button"
        className={`admin-nav-item admin-nav-item--parent ${routeActive ? "is-active" : ""}`}
        aria-expanded={expanded}
        onClick={() => setOpenByUser((open) => !open)}
      >
        <span className="admin-nav-icon" aria-hidden>
          {NAV_ICONS[item.key] ?? NAV_ICONS.orders}
        </span>
        <span className="admin-nav-text">
          <span className="admin-nav-label">{t(item.labelKey)}</span>
          <span className="admin-nav-sub">{t(item.subKey)}</span>
        </span>
        <ChevronIcon open={expanded} />
      </button>
      {expanded ? (
        <div className="admin-nav-children" role="group">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) =>
                isActive ? "admin-nav-item admin-nav-item--child is-active" : "admin-nav-item admin-nav-item--child"
              }
              end
              onClick={onNavigate}
            >
              <span className="admin-nav-text">
                <span className="admin-nav-label">{t(child.labelKey)}</span>
              </span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Sidebar groups ── */
const NAV_GROUPS = [
  { labelKey: null, keys: ["overview"] },
  {
    labelKey: "nav.sectionOrders",
    defaultLabel: "Orders",
    keys: [
      "adminManagement",
      "userInformation",
      "orders",
      "assignOrders",
      "payments",
      "customerOrderHistory",
    ],
  },
  {
    labelKey: "nav.sectionFulfillment",
    defaultLabel: "Fulfillment",
    keys: ["specialDay"],
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
    if (!hasAdminPanelAccess(user)) return [];
    return MENU_ITEMS;
  }, [user]);

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
                {groupItems.map((item) =>
                  Array.isArray(item.children) && item.children.length > 0 ? (
                    <NavItemWithChildren
                      key={item.key}
                      item={item}
                      pathname={location.pathname}
                      onNavigate={() => setMenuOpen(false)}
                      t={t}
                    />
                  ) : (
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
                  ),
                )}
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
