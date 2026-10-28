import { api, pendingStoreRead } from "./http";

const couponCache = new Map();

export function getStoreCoupons(merchantId, storeId, { refresh = false } = {}) {
  if (!merchantId || !storeId) return Promise.resolve([]);
  const key = `store-coupons:${merchantId}:${storeId}`;
  if (!refresh && couponCache.has(key)) return Promise.resolve(couponCache.get(key));
  if (refresh) couponCache.delete(key);
  return pendingStoreRead(key, async () => {
    const perPage = 100;
    let page = 1;
    let total = Infinity;
    const allCoupons = [];
    while (allCoupons.length < total) {
      const query = new URLSearchParams({
        merchantId: String(merchantId),
        storeId: String(storeId),
        page: String(page),
        perPage: String(perPage),
      });
      const response = await api.get(`/coupons?${query}`);
      const data = response?.data || response;
      if (data?.success === false) throw new Error(data.message || "Unable to load coupons.");
      if (!Array.isArray(data?.coupons)) throw new Error("Coupons API did not return a coupons array.");
      allCoupons.push(...data.coupons);
      const reportedTotal = Number(data.total);
      if (Number.isFinite(reportedTotal) && reportedTotal >= 0) total = reportedTotal;
      else if (data.coupons.length < perPage) total = allCoupons.length;
      page += 1;
      if (data.coupons.length === 0) break;
    }
    const unique = new Map();
    allCoupons.forEach((coupon) => {
      const id = coupon.id ?? coupon.couponId ?? coupon.coupon_id ?? coupon.code ?? coupon.coupon_code;
      const deleted = String(coupon.syncStatus ?? coupon.sync_status ?? coupon.status ?? "").toUpperCase() === "DELETED" || Boolean(coupon.deletedAt ?? coupon.deleted_at);
      if (!deleted && id != null && !unique.has(String(id))) unique.set(String(id), coupon);
    });
    const rows = [...unique.values()];
    couponCache.set(key, rows);
    return rows;
  });
}

export function syncStoreCoupons(merchantId, storeId) {
  if (!merchantId || !storeId) return Promise.reject(new Error("Merchant and store IDs are required to sync coupons."));
  return api.post("/coupons/sync", { merchantId, storeId });
}

export function invalidateStoreCoupons(merchantId, storeId) {
  couponCache.delete(`store-coupons:${merchantId}:${storeId}`);
}
