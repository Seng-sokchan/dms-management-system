import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
    const role = payload?.user?.role;
    if (role !== "Customer" && role !== "Delivery" && role !== "Depot") {
      throw new Error("Only Customer, Delivery, or Depot accounts can use this app");
    }
    const me = await fetchMe(payload.token);
    const nextUser = { ...payload.user, ...me };
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
