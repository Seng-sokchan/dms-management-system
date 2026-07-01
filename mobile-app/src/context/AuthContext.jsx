import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../i18n/config";
import { clearSession, loadSession, saveSession } from "../services/authStorage";
import { fetchMe, login as loginApi } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const session = await loadSession();
        if (session.token) {
          setToken(session.token);
          try {
            const me = await fetchMe(session.token);
            const merged = { ...session.user, ...me };
            setUser(merged);
            await saveSession({ token: session.token, user: merged });
          } catch {
            setUser(session.user);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function login(username, password) {
    const payload = await loginApi({ username, password, client: "mobile" });
    const me = await fetchMe(payload.token);
    const nextUser = { ...payload.user, ...me };
    const clients = nextUser.allowedClients;
    if (Array.isArray(clients) && clients.length && !clients.includes("mobile")) {
      throw new Error(i18n.t("auth.roleNotAllowed"));
    }
    const mobileMenus = nextUser.allowedMobileMenus;
    if (Array.isArray(mobileMenus) && mobileMenus.length === 0) {
      throw new Error(i18n.t("auth.roleNotAllowed"));
    }
    await saveSession({ token: payload.token, user: nextUser });
    setToken(payload.token);
    setUser(nextUser);
  }

  async function logout() {
    await clearSession();
    setToken("");
    setUser(null);
  }

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    login,
    logout,
  }), [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
