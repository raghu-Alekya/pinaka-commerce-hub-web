import { api } from "./http";
import { endpoints } from "./endpoints";

/**
 * Convert UI form data into the backend device payload.
 *
 * Postman create-device payload:
 * deviceName
 * deviceType
 * serialNumber
 * merchantId
 * storeId
 * status
 * enableImmediately
 * notes
 */
export function toDevicePayload(data) {
  return {
    deviceName: data.deviceName?.trim() || "",
    deviceType: data.deviceType || "",
    serialNumber: data.serialNumber?.trim() || "",
    merchantId: data.merchantId || data.merchant || "",
    storeId: data.storeId || data.store || "",
    status: data.status || "Active",
    enableImmediately: Boolean(data.enableImmediately),
    notes: data.notes?.trim() || "",
  };
}

/**
 * Normalize API response so the UI has predictable fields.
 *
 * This intentionally supports common response wrappers:
 * { device: {...} }
 * { data: {...} }
 * or direct {...}
 */
export function normalizeDevice(device) {
  if (!device) return null;

  return {
    ...device,

    id: device.id || device.deviceId || device.deviceCode || "",
    name: device.deviceName || device.name || "",
    type: device.deviceType || device.type || "",
    serial: device.serialNumber || device.serial || "",
    merchantId: device.merchantId || "",
    storeId: device.storeId || "",
    merchant:
      device.merchantName || device.merchant?.name || device.merchant || "",
    store: device.storeName || device.store?.name || device.store || "",
    status: device.status || "",
    lastSeen: device.lastSeen || device.last_seen || "-",
    notes: device.notes || "",
    enableImmediately: device.enableImmediately ?? device.enabled ?? false,
  };
}

/**
 * GET /devices
 */
export async function listDevices() {
  const response = await api.get(endpoints.devices);

  const items =
    response?.devices ||
    response?.data ||
    response?.items ||
    (Array.isArray(response) ? response : []);

  return items.map(normalizeDevice);
}

/**
 * GET /devices/:deviceId
 */
export async function getDevice(deviceId) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  const response = await api.get(endpoints.device(deviceId));

  const device = response?.device || response?.data || response;

  return normalizeDevice(device);
}

/**
 * POST /devices
 */
export async function createDevice(data) {
  const payload = toDevicePayload(data);

  return api.post(endpoints.devices, payload);
}

/**
 * PUT /devices/:deviceId
 */
export async function updateDevice(deviceId, data) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  const payload = toDevicePayload(data);

  return api.put(endpoints.device(deviceId), payload);
}

/**
 * POST /devices/:deviceId
 *
 * NOTE:
 * The supplied Postman collection specifically defines delete
 * as POST, not DELETE.
 */
export async function deleteDevice(deviceId) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  return api.post(endpoints.device(deviceId));
}

export const devicesApi = {
  list: listDevices,
  get: getDevice,
  create: createDevice,
  update: updateDevice,
  delete: deleteDevice,
};
