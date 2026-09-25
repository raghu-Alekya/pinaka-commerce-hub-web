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
 * status
 */
export function toDevicePayload(data) {
  return {
    deviceName: data.deviceName?.trim() || "",
    deviceCode: data.deviceCode?.trim() || "",
    deviceType: data.deviceType || "",
    serialNumber: data.serialNumber?.trim() || "",
    merchantId: data.merchantId || data.merchant || "",
    status: data.status || "Active",
  };
}

/** GET /device-types */
export async function listDeviceTypes() {
  const response = await api.get(endpoints.deviceTypes);
  const items = Array.isArray(response)
    ? response
    : response?.deviceTypes || response?.data || response?.items || [];

  return items.map((item) => {
    if (typeof item === "string") return { value: item, label: item };
    const value = item?.id || item?.deviceTypeId || item?.code || item?.name || item?.deviceType || "";
    const label = item?.name || item?.deviceTypeName || item?.deviceType || item?.label || item?.code || value;
    return value ? { value: String(value), label: String(label) } : null;
  }).filter(Boolean);
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    return await api.post(endpoints.devices, payload, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Creating the device timed out after 30 seconds. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * PUT /devices/:deviceId
 */
export async function updateDevice(deviceId, data) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  const payload = toDevicePayload(data);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    return await api.put(endpoints.device(deviceId), payload, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Updating the device timed out after 30 seconds. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** DELETE /devices/:deviceId */
export async function deleteDevice(deviceId) {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await api.delete(endpoints.device(deviceId), { signal: controller.signal });
    if (response?.success === false) {
      throw new Error(response.message || "Failed to delete device.");
    }
    return response;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Deleting the device timed out after 30 seconds. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const devicesApi = {
  list: listDevices,
  listTypes: listDeviceTypes,
  get: getDevice,
  create: createDevice,
  update: updateDevice,
  delete: deleteDevice,
};
