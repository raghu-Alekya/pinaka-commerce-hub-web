import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeTerminalMappings(storeId);

const record = (response) => response?.terminalMapping || response?.data || response;

export function getPosTerminalMappings(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosTerminalMappings(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosTerminalMappings(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
