import api from "./api";

export async function getUsersRequest() {
  const { data } = await api.get("/users");
  return data.users || [];
}

export async function createUserRequest(payload) {
  const { data } = await api.post("/admin/users", payload);
  return data.user;
}

export async function updateUserRequest(userId, payload) {
  const { data } = await api.put("/admin/users/" + userId, payload);
  return data.user;
}

export async function getHolidaysRequest() {
  const { data } = await api.get("/holidays");
  return data.holidays || [];
}

export async function createHolidayRequest(payload) {
  const { data } = await api.post("/holidays", payload);
  return data.holiday;
}

export async function deleteHolidayRequest(holidayId) {
  const { data } = await api.delete("/holidays/" + holidayId);
  return data;
}

export async function getAllLeavesRequest() {
  const { data } = await api.get("/leave/all");
  return data.leaves || [];
}
