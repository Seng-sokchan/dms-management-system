import { useMemo } from "react";
import { hasMobileMenu, resolveMobileRoot, sortMobileMenus } from "../utils/mobileAccess";

export function useMobileNavigation(user) {
  return useMemo(() => {
    const allowedMobileMenus = sortMobileMenus(
      Array.isArray(user?.allowedMobileMenus) ? user.allowedMobileMenus : [],
    );
    return {
      root: resolveMobileRoot(user),
      allowedMobileMenus,
      hasMenu: (menuKey) => hasMobileMenu(user, menuKey),
      dataScope: user?.dataScope || "none",
      statusPermissions: user?.statusPermissions || {},
    };
  }, [user]);
}
