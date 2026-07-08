import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import i18n from "../i18n/config";
import { clearSession, loadSession, saveSession } from "../services/authStorage";
import { fetchMe, login as loginApi } from "../services/authApi";
import {
  isAccessTokenExpired,
  isAccountInactiveError,
  isUnauthorizedError,
  isUserInactive,
  registerUnauthorizedHandler,
} from "../utils/authSession";
import { showAppAlert } from "../utils/appAlertBridge";
import { canUseMobileApp } from "../utils/mobileAccess";

const AuthContext = createContext(null);

function sessionAlertMessage(reason) {
  if (reason === "expired") return i18n.t("auth.sessionExpiredMessage");
  if (reason === "inactive") return i18n.t("auth.accountInactiveMessage");
  return i18n.t("auth.sessionUnauthorizedMessage");
}

function sessionAlertTitle(reason) {
  if (reason === "inactive") return i18n.t("auth.accountInactiveTitle");
  return i18n.t("auth.sessionExpiredTitle");
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef("");
  const userRef = useRef(null);
  const sessionAlertShownRef = useRef(false);

  const clearLocalAuth = useCallback(async () => {
    await clearSession();
    tokenRef.current = "";
    userRef.current = null;
    setToken("");
    setUser(null);
  }, []);

  const forceLogout = useCallback(
    async (reason = "unauthorized") => {
      const hadSession = Boolean(tokenRef.current);
      await clearLocalAuth();
      if (!hadSession) return;
      if (sessionAlertShownRef.current) return;
      sessionAlertShownRef.current = true;
      // Defer so AlertProvider handlers are registered after first mount.
      setTimeout(() => {
        showAppAlert({
          tone: "warning",
          title: sessionAlertTitle(reason),
          message: sessionAlertMessage(reason),
        });
      }, 0);
    },
    [clearLocalAuth],
  );

  useEffect(() => registerUnauthorizedHandler((reason) => forceLogout(reason || "unauthorized")), [forceLogout]);

  const applySessionUser = useCallback(async (nextToken, nextUser) => {
    userRef.current = nextUser;
    setUser(nextUser);
    await saveSession({ token: nextToken, user: nextUser });
  }, []);

  const validateSessionWithBackend = useCallback(
    async ({ allowOffline = false } = {}) => {
      const current = tokenRef.current;
      if (!current) return;

      if (isAccessTokenExpired(current)) {
        await forceLogout("expired");
        return;
      }

      try {
        const me = await fetchMe(current);
        if (isUserInactive(me)) {
          await forceLogout("inactive");
          return;
        }
        const merged = { ...userRef.current, ...me };
        if (!canUseMobileApp(merged)) {
          await forceLogout("unauthorized");
          return;
        }
        await applySessionUser(current, merged);
      } catch (error) {
        if (isAccountInactiveError(error)) {
          await forceLogout("inactive");
          return;
        }
        if (isUnauthorizedError(error)) {
          await forceLogout("unauthorized");
          return;
        }
        if (!allowOffline) {
          throw error;
        }
      }
    },
    [applySessionUser, forceLogout],
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        const session = await loadSession();
        if (!session.token) return;

        if (isAccessTokenExpired(session.token)) {
          await forceLogout("expired");
          return;
        }

        tokenRef.current = session.token;
        setToken(session.token);
        userRef.current = session.user;
        setUser(session.user);

        try {
          await validateSessionWithBackend({ allowOffline: true });
        } catch {
          // Offline / transient errors: keep cached session
        }
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [forceLogout, validateSessionWithBackend]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      void validateSessionWithBackend({ allowOffline: true });
    });
    return () => subscription.remove();
  }, [validateSessionWithBackend]);

  async function login(username, password) {
    const payload = await loginApi({ username, password, client: "mobile" });
    const me = await fetchMe(payload.token);
    if (isUserInactive(me)) {
      throw new Error(i18n.t("auth.accountInactiveMessage"));
    }
    const nextUser = { ...payload.user, ...me };
    if (!canUseMobileApp(nextUser)) {
      throw new Error(i18n.t("auth.roleNotAllowed"));
    }
    sessionAlertShownRef.current = false;
    await saveSession({ token: payload.token, user: nextUser });
    tokenRef.current = payload.token;
    userRef.current = nextUser;
    setToken(payload.token);
    setUser(nextUser);
  }

  async function logout() {
    sessionAlertShownRef.current = false;
    await clearLocalAuth();
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
