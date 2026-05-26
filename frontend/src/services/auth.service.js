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

export async function forgotPasswordRequest(payload) {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
}

export async function validateResetTokenRequest(token) {
  const { data } = await api.get("/auth/validate-reset-token", {
    params: { token },
  });
  return data;
}

export async function resetPasswordRequest(payload) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}
