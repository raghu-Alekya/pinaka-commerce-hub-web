import { api } from "./http";
import { endpoints } from "./endpoints";

export const tendorsApi = {
  // Get all tendors
  getAll: () => api.get(endpoints.tendors),

  // Get only active tendors
  getActive: () => api.get(`${endpoints.tendors}?status=ACTIVE`),

  // Get single tendor
  getById: (id) => api.get(endpoints.tendor(id)),

  // Create tendor
  create: (data) => api.post(endpoints.tendors, data),

  // Update tendor
  update: (id, data) => api.put(endpoints.tendor(id), data),

  // Partial update
  patch: (id, data) => api.patch(endpoints.tendor(id), data),

  // Delete tendor - API performs soft delete
  delete: (id) => api.delete(endpoints.tendor(id)),

  // Get tendors assigned to a merchant
  getMerchantTendors: (merchantId) =>
    api.get(endpoints.merchantTendors(merchantId)),

  // Assign tendors to a merchant
  assignToMerchant: (merchantId, tendorIds) =>
    api.post(endpoints.merchantTendors(merchantId), { tendorIds }),

  // Remove a tendor from a merchant
  removeFromMerchant: (merchantId, tendorId) =>
    api.delete(endpoints.merchantTendor(merchantId, tendorId)),
};
