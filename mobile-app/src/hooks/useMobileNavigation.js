import { useMemo } from "react";
import {
  getMobileMenusForRole,
  hasMobileMenu,
  resolveMobileRoot,
  sortMobileMenus,
} from "../utils/mobileAccess";

export function useMobileNavigation(user) {
  return useMemo(() => {
    const allowedMobileMenus = sortMobileMenus(getMobileMenusForRole(user?.role));
    return {
      root: resolveMobileRoot(user),
      allowedMobileMenus,
      hasMenu: (menuKey) => hasMobileMenu(user, menuKey),
      dataScope: user?.dataScope || "none",
      statusPermissions: user?.statusPermissions || {},
    };
  }, [user]);
}
