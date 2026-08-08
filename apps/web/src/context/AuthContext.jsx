import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setAccessToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken("");
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    api.post("/auth/refresh")
      .then(({ data }) => {
        if (!active) return;
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      })
      .catch(() => active && clearSession())
      .finally(() => active && setLoading(false));
    const onExpired = () => clearSession();
    window.addEventListener("nova:auth-expired", onExpired);
    return () => { active = false; window.removeEventListener("nova:auth-expired", onExpired); };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } finally { clearSession(); }
  }, [clearSession]);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak.");
  return value;
}
