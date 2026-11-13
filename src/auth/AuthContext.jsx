import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getConsoleProfile,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "../api/auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getRememberMe,
  getStoredUser,
  setRememberMe,
  setStoredUser,
} from "./tokenStore";
import { can as userCan } from "./permissions";

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

        let nextUser = getStoredUser();
        if (nextUser?.accountType) {
          const profile = await getConsoleProfile();
          nextUser = profile?.user || nextUser;
          setStoredUser(nextUser, getRememberMe());
        }

        if (!cancelled) {
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

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === "pch.accessToken") {
        if (!event.newValue) {
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(getStoredUser());
          setIsAuthenticated(true);
        }
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
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
      can(moduleName, action = "view") {
        return userCan(user, moduleName, action);
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
