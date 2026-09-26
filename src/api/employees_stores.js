import { api } from "./http";
import { endpoints } from "./endpoints";

/**
 * Fetch active employees for a merchant from Connector API
 * Endpoint: /connector/api/v1/merchants/{merchantId}/employees?status=ACTIVE
 */
export async function listMerchantEmployees(merchantId, status = "ACTIVE") {
  if (!merchantId) return [];
  try {
    const res = await api.get(endpoints.merchantEmployees(merchantId, status));
    const list =
      res?.employees ?? res?.data?.employees ?? (Array.isArray(res) ? res : []);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn("Failed to fetch merchant employees:", err);
    return [];
  }
}
