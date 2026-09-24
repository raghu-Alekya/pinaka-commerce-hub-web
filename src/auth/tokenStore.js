const ACCESS_KEY = "pch.accessToken";
const REFRESH_KEY = "pch.refreshToken";
const USER_KEY = "pch.sessionUser";
const REMEMBER_KEY = "pch.rememberMe";

let accessToken = null;

function getStoredValue(key) {
  const value = localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  // Sync from sessionStorage to localStorage if found, so newly opened tabs have access
  if (value && !localStorage.getItem(key)) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
  return value;
}

export function getAccessToken() {
  return accessToken || getStoredValue(ACCESS_KEY);
}

export function setAccessToken(token, remember = true) {
  accessToken = token || null;
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ACCESS_KEY);

  if (!token) return;

  // Storing in localStorage ensures all tabs in the same browser share the session
  localStorage.setItem(ACCESS_KEY, token);
}

export function getRefreshToken() {
  return getStoredValue(REFRESH_KEY);
}

export function setRefreshToken(token, remember = true) {
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_KEY);

  if (!token) return;

  localStorage.setItem(REFRESH_KEY, token);
}

export function getStoredUser() {
  const raw = getStoredValue(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user, remember = true) {
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);

  if (!user) return;

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRememberMe(remember) {
  if (remember) localStorage.setItem(REMEMBER_KEY, "1");
  else localStorage.removeItem(REMEMBER_KEY);
}

export function clearSession() {
  accessToken = null;
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
}
