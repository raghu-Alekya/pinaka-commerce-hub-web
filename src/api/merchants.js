import { api } from "./http";
import { endpoints } from "./endpoints";

export function toMerchantPayload(data) {
  return {
    merchantId: data.merchantId,
    businessName: data.businessName,
    legalBusinessName: data.legalBusinessName,
    businessType: data.businessType,
    country: data.country,
    state: data.state,
    city: data.city,
    postalCode: data.postalCode,
    businessAddress: data.businessAddress,
    taxId: data.taxId,
    contact: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      alternatePhone: data.alternatePhone,
      billingContact: data.billingContact,
    },
    stores: data.stores,
    subscription: {
      plan: data.plan,
      billingCycle: data.billingCycle,
      trialPeriod: Number(data.trialPeriod),
    },
    onboardingStatus: data.onboardingStatus || "Completed",
  };
}

export function listMerchants() {
  return api.get(endpoints.merchants);
}

export function getMerchant(id) {
  return api.get(endpoints.merchant(id));
}

export function createMerchant(data) {
  return api.post(endpoints.merchants, toMerchantPayload(data));
}

export function updateMerchant(id, data) {
  return api.put(endpoints.merchant(id), toMerchantPayload(data));
}
