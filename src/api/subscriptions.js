import { api } from "./http";
const path = (id) => `/subscriptions/${encodeURIComponent(id)}`;
export const listSubscriptions = () => api.get("/subscriptions");
export const listSubscriptionPlans = () => api.get("/subscription-plans");
export const getSubscription = (id) => api.get(path(id));
export const createSubscription = (data) => api.post("/subscriptions", data);
export const updateSubscription = (id, data) => api.put(path(id), data);
export const deleteSubscription = (id) => api.delete(path(id));
export function subscriptionPayload(form) {
  return {
    planCode: form.planCode,
    planName: form.planName,
    maxStoresAllowed: Number(form.maxStoresAllowed),
    entitlements: Array.isArray(form.entitlements)
      ? form.entitlements
      : [
          ...new Set(
            form.entitlements
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ],
    billingCycle: form.billingCycle,
    trialDays: Number(form.trialDays),
    price: Number(form.price),
    status: form.status,
    ...(form.currentPeriodStart
      ? { currentPeriodStart: new Date(form.currentPeriodStart).toISOString() }
      : {}),
    ...(form.currentPeriodEnd
      ? { currentPeriodEnd: new Date(form.currentPeriodEnd).toISOString() }
      : {}),
  };
}
