import { useEffect, useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CUSTOMER_PORTAL_MENU,
  DEPOT_PORTAL_MENU,
  shouldHidePortalTabBar,
} from "../constants/menus";
import { usePortalPreferences } from "../context/PortalPreferencesContext";
import { TabIcon } from "./TabIcon";
import "./PortalLayout.css";

export function PortalLayout({ user, flash, onFlashDismiss, cartBadge = 0 }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { resolvedTheme, fontSizePreference } = usePortalPreferences();

  const menuItems = useMemo(() => {
    if (user?.role === "Depot") return DEPOT_PORTAL_MENU;
    return CUSTOMER_PORTAL_MENU;
  }, [user?.role]);

  const hideTabBar = shouldHidePortalTabBar(location.pathname);

  useEffect(() => {
    if (!flash?.text || flash.variant !== "success") return;
    const id = setTimeout(() => onFlashDismiss?.(), 5000);
    return () => clearTimeout(id);
  }, [flash, onFlashDismiss]);

  return (
    <div
      className="portal-shell"
      data-theme={resolvedTheme}
      data-font-size={fontSizePreference}
    >
      <main className={`portal-main${hideTabBar ? " portal-main--full" : ""}`}>
        {flash?.text ? (
          <div
            className={`portal-flash${flash.variant === "error" ? " portal-flash--error" : ""}`}
            role="status"
          >
            {flash.text}
          </div>
        ) : null}
        <Outlet context={{ cartBadge, user }} />
      </main>

      {!hideTabBar ? (
        <nav className="portal-tabbar" aria-label={t("a11y.mainNav")}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `portal-tab${isActive ? " is-active" : ""}`}
              end={item.path !== "/portal/items" && item.path !== "/portal/prepare-batch"}
            >
              {({ isActive }) => (
                <>
                  <TabIcon name={item.icon} active={isActive} />
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
