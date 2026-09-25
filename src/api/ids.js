import { api } from "./http";

export async function allocateId(kind) {
  try {
    const result = await api.post(`/ids/${kind}`, {});
    return result?.id || result?.data?.id || null;
  } catch {
    return null;
  }
}

export default { allocateId };
