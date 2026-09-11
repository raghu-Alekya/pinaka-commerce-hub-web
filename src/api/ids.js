import { api } from './http';
export async function allocateId(kind) { const result = await api.post('/ids/' + kind, {}); return result.id; }
