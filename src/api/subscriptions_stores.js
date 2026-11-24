import { api } from "./http";
import { endpoints } from "./endpoints";

/**
 * Fetch active subscriptions through the merchant-scoped subscriptions API.
 */
export async function getActiveSubscriptions(merchantId) {
  if (!merchantId) return null;
  return api.get(endpoints.merchantActiveSubscriptions(merchantId));
}

/**
 * Helper to unwrap the active subscription object from the API response
 */
export function extractActiveSubscription(response) {
  if (!response) return null;
  const list =
    response?.subscriptions ??
    response?.data?.subscriptions ??
    response?.data ??
    response;

  if (Array.isArray(list)) {
    return (
      list.find((s) => String(s.status || "").toUpperCase() === "ACTIVE") ||
      list[0] ||
      null
    );
  }

  return (
    response?.subscription ??
    response?.data?.subscription ??
    (response?.id ? response : null)
  );
}
