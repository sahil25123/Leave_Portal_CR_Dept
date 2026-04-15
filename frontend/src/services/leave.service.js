import api from "./api";

export async function applyLeaveRequest(payload) {
  const { data } = await api.post("/leave/apply", payload);
  return data;
}

export async function getMyLeaveHistoryRequest() {
  const { data } = await api.get("/leave/history/me");
  return data.leaves || [];
}

export async function getMyLeaveBalanceRequest() {
  const { data } = await api.get("/leave/balance/me");
  return data.balance;
}

export async function getDeanPendingLeavesRequest() {
  const { data } = await api.get("/leave/pending/dean");
  return data.leaves || [];
}

export async function approveByDeanRequest(leaveId) {
  const { data } = await api.post("/leave/approve/dean/" + leaveId);
  return data.leave;
}

export async function rejectByDeanRequest(leaveId, reason) {
  const { data } = await api.post("/leave/reject/dean/" + leaveId, { reason });
  return data.leave;
}
