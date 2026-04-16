import api from "./api";

export async function loginRequest(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getCurrentUserRequest() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function changePasswordRequest(payload) {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}
