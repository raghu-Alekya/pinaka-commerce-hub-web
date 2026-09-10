import { API_BASE_URL } from "../config/env";
import { getAccessToken, setAccessToken } from "../auth/tokenStore";
import { endpoints } from "./endpoints";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/connector/") || normalizedPath.startsWith("/connectors/")) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshSession } = await import("./auth");
      return refreshSession();
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(
  path,
  { method = "GET", body, headers, skipAuthRefresh = false } = {}
) {
  const token = getAccessToken();
  const response = await fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseBody(response);

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    path !== endpoints.login &&
    path !== endpoints.refresh
  ) {
    try {
      await refreshAccessToken();
      return apiRequest(path, {
        method,
        body,
        headers,
        skipAuthRefresh: true,
      });
    } catch {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(
      Array.isArray(message) ? message.join(", ") : message,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};
