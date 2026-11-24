import { api } from "./http";

export async function listPchUsers() {
  const response = await api.get("/api/v1/pch-users");
  if (!Array.isArray(response?.users)) throw new Error("Unable to read PCH users from the API.");
  return response.users;
}

export async function createPchUser(user) {
  const response = await api.post("/api/v1/pch-users", {
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    phone_number: user.phoneNumber,
    email: user.email,
    role: user.role,
    password: user.password,
  });
  if (!response?.user?.id) throw new Error("The API did not return the saved PCH user.");
  return response.user;
}

export async function updatePchUser(id, user) {
  const response = await api.patch(`/api/v1/pch-users/${encodeURIComponent(id)}`, {
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    phone_number: user.phoneNumber,
    email: user.email,
    role: user.role,
    ...(user.password ? { password: user.password } : {}),
  });
  if (!response?.user?.id) throw new Error("The API did not return the updated PCH user.");
  return response.user;
}

export async function disablePchUser(id) {
  const response = await api.delete(`/api/v1/pch-users/${encodeURIComponent(id)}`);
  if (!response?.user?.id || response.user.status !== "DISABLED") {
    throw new Error("The API did not confirm that the PCH user was deactivated.");
  }
  return response.user;
}

export async function enablePchUser(id) {
  const response = await api.patch(`/api/v1/pch-users/${encodeURIComponent(id)}/enable`);
  if (!response?.user?.id || response.user.status !== "ACTIVE") {
    throw new Error("The API did not confirm that the PCH user was enabled.");
  }
  return response.user;
}

