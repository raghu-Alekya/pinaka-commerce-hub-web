const ACCESS_KEY = "pch.accessToken";
const REFRESH_KEY = "pch.refreshToken";
const USER_KEY = "pch.sessionUser";
const REMEMBER_KEY = "pch.rememberMe";

let accessToken =
  sessionStorage.getItem(ACCESS_KEY) || localStorage.getItem(ACCESS_KEY);

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token, remember = getRememberMe()) {
  accessToken = token || null;
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ACCESS_KEY);

  if (!token) return;

  const store = remember ? localStorage : sessionStorage;
  store.setItem(ACCESS_KEY, token);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY) || localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token, remember = false) {
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_KEY);

  if (!token) return;

  const store = remember ? localStorage : sessionStorage;
  store.setItem(REFRESH_KEY, token);
}

export function getStoredUser() {
  const raw =
    sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user, remember = false) {
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);

  if (!user) return;

  const store = remember ? localStorage : sessionStorage;
  store.setItem(USER_KEY, JSON.stringify(user));
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
