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

export async function resetUserPasswordRequest(userId, payload) {
  const { data } = await api.put(
    "/admin/users/" + userId + "/reset-password",
    payload,
  );
  return data;
}

export async function getHolidaysRequest() {
  const { data } = await api.get("/holidays");
  return data.holidays || [];
}

export async function createHolidayRequest(payload) {
  const { data } = await api.post("/holidays", payload);
  return data.holiday;
}

export async function updateHolidayRequest(holidayId, payload) {
  const { data } = await api.put("/holidays/" + holidayId, payload);
  return data.holiday;
}

export async function syncHolidaysRequest(year) {
  const payload = typeof year === "number" ? { year } : {};
  const { data } = await api.post("/holidays/sync", payload);
  return data;
}

export async function deleteHolidayRequest(holidayId) {
  const { data } = await api.delete("/holidays/" + holidayId);
  return data;
}

export async function getAllLeavesRequest() {
  const { data } = await api.get("/leave/all");
  return data.leaves || [];
}

export async function getLeaveYearsRequest() {
  const { data } = await api.get("/admin/year");
  return data.years || [];
}

export async function getActiveLeaveYearRequest() {
  const { data } = await api.get("/admin/year/active");
  return data.activeYear;
}

export async function createLeaveYearRequest(payload) {
  const { data } = await api.post("/admin/year", payload);
  return data.year;
}

export async function activateLeaveYearRequest(yearId) {
  const { data } = await api.put("/admin/year/" + yearId + "/activate");
  return data.year;
}
