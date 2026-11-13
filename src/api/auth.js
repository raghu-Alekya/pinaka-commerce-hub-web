import { api, ApiError } from "./http";
import { getStoredUser } from "../auth/tokenStore";
import { endpoints } from "./endpoints";
import {
  clearSession,
  getRememberMe,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
} from "../auth/tokenStore";

function unwrapAuthPayload(data) {
  if (!data || typeof data !== "object") return data;
  if (data.data && typeof data.data === "object") return data.data;
  return data;
}

function applyAuthResponse(data, remember = getRememberMe()) {
  const payload = unwrapAuthPayload(data);
  const accessToken =
    payload?.accessToken || payload?.access_token || payload?.token || null;
  const refreshToken =
    payload?.refreshToken || payload?.refresh_token || null;
  const user = payload?.user || null;

  if (accessToken) {
    setAccessToken(accessToken, remember);
  }

  if (refreshToken) {
    setRefreshToken(refreshToken, remember);
  }

  if (user) {
    setStoredUser(user, remember);
  }

  return {
    ...payload,
    accessToken,
    refreshToken,
    user,
  };
}

export async function login(email, password, remember = false) {
  const attempts = [
    "/api/v1/pos/auth/merchant-login",
    "/api/v1/pos/auth/employee-console-login",
    endpoints.login,
  ];
  let lastError = null;

  for (const path of attempts) {
    try {
      const data = await api.post(path, { email, password }, { skipAuthRefresh: true });
      if (data && data.success === false) {
        lastError = new ApiError(data.message || "Invalid email or password.", 401, data);
        continue;
      }
      return applyAuthResponse(data, remember);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new ApiError("Invalid email or password.", 401, null);
}

export function getConsoleProfile() {
  return api.get("/api/v1/pos/auth/console/me");
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const data = await api.post(
    endpoints.refresh,
    { refreshToken },
    { skipAuthRefresh: true }
  );
  return applyAuthResponse(data);
}

export async function logout() {
  const refreshToken = getRefreshToken();
  const accountType = getStoredUser()?.accountType;
  try {
    if (accountType) {
      await api.post("/api/v1/pos/auth/console/logout", {}, { skipAuthRefresh: true });
    } else if (refreshToken) {
      await api.post(
        endpoints.logout,
        { refreshToken },
        { skipAuthRefresh: true }
      );
    }
  } catch {
    // Clear the local session even if logout is not implemented yet.
  } finally {
    clearSession();
  }
}

export function getProfile() {
  return api.get(endpoints.me);
}
