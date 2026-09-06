import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "../api/auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setRememberMe,
} from "./tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getAccessToken() || getStoredUser())
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        if (!getAccessToken()) {
          if (getRefreshToken()) {
            await refreshSession();
          } else {
            throw new Error("No stored session");
          }
        }

        if (!cancelled) {
          const nextUser = getStoredUser();
          setUser(nextUser);
          setIsAuthenticated(Boolean(getAccessToken() || nextUser));
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated,
      async login(email, password, remember = false) {
        setRememberMe(remember);
        const data = await loginRequest(email, password, remember);
        const nextUser = data.user || getStoredUser() || { email };
        setUser(nextUser);
        setIsAuthenticated(true);
        return data;
      },
      async logout() {
        try {
          await logoutRequest();
        } finally {
          setUser(null);
          setIsAuthenticated(false);
        }
      },
    }),
    [user, isReady, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
