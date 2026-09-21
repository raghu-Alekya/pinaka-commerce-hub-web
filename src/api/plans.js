import { api } from "./http";
import { endpoints } from "./endpoints";
 
 
const toApiBillingModel = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
 
  if (
    normalized === "PER STORE" ||
    normalized === "PER_STORE"
  ) {
    return "PER_STORE";
  }
 
  if (
    normalized === "PER TERMINAL" ||
    normalized === "PER_TERMINAL"
  ) {
    return "PER_TERMINAL";
  }
 
  if (
    normalized === "FLAT RATE" ||
    normalized === "FLAT"
  ) {
    return "FLAT";
  }
 
  return normalized;
};
 
/**
 * Convert billing cycle from UI format
 * to API format.
 */
const toApiBillingCycle = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
 
  if (normalized === "MONTHLY") {
    return "MONTHLY";
  }
 
  if (normalized === "QUARTERLY") {
    return "QUARTERLY";
  }
 
  if (
    normalized === "YEARLY" ||
    normalized === "ANNUAL"
  ) {
    return "YEARLY";
  }
 
  return normalized;
};
 
/**
 * Convert status to API format.
 */
const toApiStatus = (value) => {
  const normalized = String(value || "ACTIVE")
    .trim()
    .toUpperCase();
 
  if (normalized === "INACTIVE") {
    return "INACTIVE";
  }
 
  return "ACTIVE";
};
 
/**
 * Convert value to number.
 */
const toNumberOrZero = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }
 
  const number = Number(value);
 
  return Number.isFinite(number)
    ? number
    : 0;
};
 
 
const toTrialDays = (value) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }
 
  const match = String(value || "").match(/\d+/);
 
  if (!match) {
    return 0;
  }
 
  return Number(match[0]);
};
 
 
const toEffectiveFrom = (value) => {
  if (!value) {
    return undefined;
  }
 
  const date = new Date(value);
 
  if (Number.isNaN(date.getTime())) {
    return value;
  }
 
  return date.toISOString();
};
 
/* ============================================================
 * PLAN REQUEST PAYLOAD
 * ============================================================ */
 
 
export function planPayload(
  form,
  includedFeatures = []
) {
  const selectedStoreType =
    form?.applicableStoreType ??
    form?.storeType ??
    "";
 
  const normalizedStoreType =
    typeof selectedStoreType === "string"
      ? selectedStoreType.trim()
      : selectedStoreType && typeof selectedStoreType === "object"
        ? (
            selectedStoreType.id ||
            selectedStoreType._id ||
            selectedStoreType.storeTypeId ||
            selectedStoreType.name ||
            selectedStoreType.storeTypeName ||
            selectedStoreType.code ||
            ""
          )
        : "";
 
  const payload = {
    planCode: String(form.code || "")
      .trim()
      .toUpperCase(),
    name: String(form.name || "").trim(),
    description: String(form.description || "").trim(),
    billingModel: toApiBillingModel(form.billingModel),
    basePrice: toNumberOrZero(form.basePrice),
    currency: String(form.currency || "").trim().toUpperCase(),
    billingCycle: toApiBillingCycle(form.billingCycle),
    status: toApiStatus(form.status),
    storeType: normalizedStoreType,
    includedStores: toNumberOrZero(form.includedStores),
    includedTerminals: toNumberOrZero(form.includedTerminals),
    additionalTerminalPrice: toNumberOrZero(form.additionalTerminalPrice),
    includedEmployees: toNumberOrZero(form.includedUsers),
    additionalEmployeePrice: toNumberOrZero(form.additionalUserPrice),
    trialPeriod: toTrialDays(form.trialPeriod),
    includedFeatures: Array.isArray(includedFeatures) ? includedFeatures : [],
  };
 
  const effectiveFrom = toEffectiveFrom(form.effectiveFrom);
 
  if (effectiveFrom) {
    payload.effectiveFrom = effectiveFrom;
  }
 
  return payload;
}
 
/* ============================================================
 * API RESPONSE HELPERS
 * ============================================================ */
 
/**
 * Extract one plan from different
 * possible API response formats.
 */
const unwrapPlan = (response) => {
  if (response?.plan) {
    return response.plan;
  }
 
  if (response?.data?.plan) {
    return response.data.plan;
  }
 
  if (response?.data) {
    return response.data;
  }
 
  return response;
};
 
/**
 * Extract plan array from different
 * possible API response formats.
 */
const extractPlans = (response) => {
  // API returned an array directly.
  if (Array.isArray(response)) {
    return response;
  }
 
  // API returned:
  // { plans: [...] }
  if (Array.isArray(response?.plans)) {
    return response.plans;
  }
 
  // API returned:
  // { data: [...] }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
 
  // API returned:
  // { data: { plans: [...] } }
  if (
    Array.isArray(
      response?.data?.plans
    )
  ) {
    return response.data.plans;
  }
 
  // API returned one plan.
  if (response?.plan) {
    return [response.plan];
  }
 
  return [];
};
 
 
const displayBillingModel = (value) => {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();
 
  if (
    normalized === "PER_STORE" ||
    normalized === "PER STORE"
  ) {
    return "Per store";
  }
 
  if (
    normalized === "PER_TERMINAL" ||
    normalized === "PER TERMINAL"
  ) {
    return "Per terminal";
  }
 
  if (
    normalized === "FLAT" ||
    normalized === "FLAT_RATE"
  ) {
    return "Flat rate";
  }
 
  return value || "";
};
 
/**
 * Convert API billing cycle
 * back to UI value.
 */
const displayBillingCycle = (value) => {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();
 
  if (normalized === "MONTHLY") {
    return "Monthly";
  }
 
  if (normalized === "QUARTERLY") {
    return "Quarterly";
  }
 
  if (
    normalized === "YEARLY" ||
    normalized === "ANNUAL"
  ) {
    return "Yearly";
  }
 
  return value || "";
};
 
/**
 * Convert API status to UI status.
 */
const displayStatus = (value) => {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();
 
  if (normalized === "INACTIVE") {
    return "Inactive";
  }
 
  return "Active";
};
 
/**
 * Convert trial period to UI format.
 */
const displayTrialPeriod = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }
 
  const number = Number(value);
 
  if (Number.isFinite(number)) {
    return `${number} days`;
  }
 
  return String(value);
};
 
/* ============================================================
 * NORMALIZE API PLAN
 * ============================================================ */
 
/**
 * Convert API plan data into the structure
 * already used by CreatePlan.jsx.
 *
 * This means the existing UI does not need
 * to be rewritten to understand API field names.
 */
export function normalizePlan(item) {
  if (!item) {
    return null;
  }
 
  /* ----------------------------------------------------------
   * Plan ID
   * ---------------------------------------------------------- */
  const id =
    item.id ||
    item._id ||
    item.planId;
 
  /* ----------------------------------------------------------
   * Plan code
   * ---------------------------------------------------------- */
  const code =
    item.planCode ||
    item.code ||
    "";
 
  /* ----------------------------------------------------------
   * Included features
   * ---------------------------------------------------------- */
  const rawFeatures =
    item.included_features ||
    item.includedFeatures;
 
  const includedFeatures =
    Array.isArray(rawFeatures)
      ? rawFeatures.map(
          (feature, index) => {
            /**
             * API may return a string:
             *
             * "POS"
             */
            if (
              typeof feature === "string"
            ) {
              return feature;
            }
 
            /**
             * API may return an object.
             */
            return {
              ...feature,
 
              id:
                feature.id ||
                feature._id ||
                index + 1,
 
              name:
                feature.name ||
                feature.featureKey ||
                feature.code ||
                "",
            };
          }
        )
      : [];
 
  /* ----------------------------------------------------------
   * Created date
   * ---------------------------------------------------------- */
  const createdAt =
    item.createdAt ||
    item.created_at ||
    item.createdOn;
 
  const updatedAt =
    item.updatedAt ||
    item.updated_at ||
    item.updatedOn;
 
  /* ----------------------------------------------------------
   * Return normalized plan
   * ---------------------------------------------------------- */
  return {
    /**
     * Keep original API properties.
     */
    ...item,
 
    /**
     * Existing CreatePlan UI properties.
     */
    id,
 
    code,
 
    name:
      item.name || "",
 
    description:
      item.description || "",
 
    /* Store type */
    storeType:
      item.store_type ||
      item.storeType ||
      item.applicableStoreType ||
      "",
 
    applicableStoreType:
      item.store_type ||
      item.storeType ||
      item.applicableStoreType ||
      "",
 
    /* Billing model */
    billingModel:
      displayBillingModel(
        item.billingModel ||
        item.billing_model
      ),
 
    /* Currency */
    currency:
      item.currency || "",
 
    /* Price */
    price:
      item.basePrice ??
      item.base_price ??
      item.price ??
      0,
 
    basePrice:
      item.basePrice ??
      item.base_price ??
      item.price ??
      0,
 
    /* Billing cycle */
    cycle:
      displayBillingCycle(
        item.billingCycle ||
        item.billing_cycle ||
        item.cycle
      ),
 
    billingCycle:
      displayBillingCycle(
        item.billingCycle ||
        item.billing_cycle ||
        item.cycle
      ),
 
    /* Status */
    status:
      displayStatus(
        item.status
      ),
 
    /* Included stores */
    includedStores:
      item.included_stores ??
      item.includedStores ??
      0,
 
    /* Included terminals */
    includedTerminals:
      item.included_terminals ??
      item.includedTerminals ??
      0,
 
    /* Additional terminal price */
    additionalTerminalPrice:
      item.additional_terminal_price ??
      item.additionalTerminalPrice ??
      0,
 
    /* Included employees/users */
    includedUsers:
      item.includedEmployees ??
      item.included_employees ??
      item.includedUsers ??
      0,
 
    /* Additional employee price */
    additionalUserPrice:
      item.additionalEmployeePrice ??
      item.additional_employee_price ??
      item.additionalUserPrice ??
      0,
 
    /* Trial period */
    trialPeriod:
      displayTrialPeriod(
        item.trial_period ??
        item.trialPeriod
      ),
 
    /* Effective date */
    effectiveFrom:
      item.effective_from ||
      item.effectiveFrom ||
      "",
 
    /* Features */
    includedFeatures,
 
    /* Dates */
    createdOn: createdAt
      ? new Date(
          createdAt
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }
        )
      : "—",
 
    updatedOn: updatedAt
      ? new Date(
          updatedAt
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }
        )
      : "—",
  };
}
 
/* ============================================================
 * GET ALL PLANS
 * ============================================================ */
 
/**
 * GET /plans
 */
export async function listPlans() {
  const response =
    await api.get(
      endpoints.plans
    );
 
  const plans =
    extractPlans(response);
 
  return plans
    .map(normalizePlan)
    .filter(Boolean);
}
 
/* ============================================================
 * GET SINGLE PLAN
 * ============================================================ */
 
/**
 * GET /plans/:id
 */
export async function getPlan(id) {
  const response =
    await api.get(
      endpoints.plan(id)
    );
 
  return normalizePlan(
    unwrapPlan(response)
  );
}
 
/* ============================================================
 * CREATE PLAN
 * ============================================================ */
 
/**
 * POST /plans
 */
export async function createPlan(
  form,
  includedFeatures = []
) {
  const payload =
    planPayload(
      form,
      includedFeatures
    );
 
  const response =
    await api.post(
      endpoints.plans,
      payload
    );
 
  return normalizePlan(
    unwrapPlan(response)
  );
}
 
/* ============================================================
 * UPDATE PLAN
 * ============================================================ */
 
/**
 * PUT /plans/:id
 */
export async function updatePlan(
  id,
  form,
  includedFeatures = []
) {
  const payload =
    planPayload(
      form,
      includedFeatures
    );
 
  const response =
    await api.put(
      endpoints.plan(id),
      payload
    );
 
  return normalizePlan(
    unwrapPlan(response)
  );
}
 
/* ============================================================
 * UPDATE PLAN STATUS
 * ============================================================ */
 
/**
 * PATCH /plans/:id/status
 */
export async function updatePlanStatus(
  id,
  status
) {
  return api.patch(
    endpoints.planStatus(id),
    {
      status: toApiStatus(
        status
      ),
    }
  );
}
 
/* ============================================================
 * DELETE PLAN
 * ============================================================ */
 
/**
 * DELETE /plans/:id
 */
export async function deletePlan(id) {
  return api.delete(
    endpoints.plan(id)
  );
}