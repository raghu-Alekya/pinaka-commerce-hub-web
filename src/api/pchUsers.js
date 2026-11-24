import { api } from "./http";

export async function listPchUsers() {
  const response = await api.get("/api/v1/pch-users");
  return response?.users || [];
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
  return response?.user;
}
