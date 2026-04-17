import api from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || api.defaults.baseURL || "/api";

function getApiOrigin() {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export async function applyLeaveRequest(payload) {
  const isFormData = payload instanceof FormData;
  const { data } = await api.post(
    "/leave/apply",
    payload,
    isFormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined,
  );
  return data;
}

export async function getMyLeaveHistoryRequest() {
  const { data } = await api.get("/leave/history/me");
  return data.leaves || [];
}

export async function getLeaveHolidaysRequest() {
  const { data } = await api.get("/holidays");
  return data.holidays || [];
}

export async function getMyLeaveBalanceRequest() {
  const { data } = await api.get("/leave/balance/me");
  return data.balance;
}

export async function getMonthlyLeaveSummaryRequest() {
  const { data } = await api.get("/leave/monthly-summary");
  return data.summary || [];
}

export async function getDeanDashboardOverviewRequest() {
  const { data } = await api.get("/leave/dean/overview");
  return data;
}

export async function getDeanPendingLeavesRequest() {
  const { data } = await api.get("/leave/pending");
  return data.leaves || [];
}

export async function getLeaveUserDetailsForDeanRequest(userId) {
  const { data } = await api.get("/leave/user/" + userId);
  return data;
}

export async function approveByDeanRequest(leaveId) {
  const { data } = await api.post("/leave/approve/dean/" + leaveId);
  return data.leave;
}

export async function rejectByDeanRequest(leaveId, reason) {
  const { data } = await api.post("/leave/reject/dean/" + leaveId, { reason });
  return data.leave;
}

export function resolveUploadUrl(filePath) {
  if (!filePath) {
    return "";
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const normalizedPath = String(filePath)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const origin = getApiOrigin();

  if (normalizedPath.startsWith("uploads/")) {
    return origin + "/" + normalizedPath;
  }

  return origin + "/uploads/" + normalizedPath;
}
