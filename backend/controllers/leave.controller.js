import {
  applyLeave as applyLeaveService,
  approveByDean as approveByDeanService,
  getDeanDashboardOverview as getDeanDashboardOverviewService,
  getLeaveUserDetailsForDean as getLeaveUserDetailsForDeanService,
  getMonthlyLeaveSummary as getMonthlyLeaveSummaryService,
  getMyLeaveBalance as getMyLeaveBalanceService,
  getMyLeaveHistory as getMyLeaveHistoryService,
  getPendingLeaves as getPendingLeavesService,
  getPendingLeavesForDean as getPendingLeavesForDeanService,
  rejectByDean as rejectByDeanService,
} from "../services/leave.service.js";
import { getRequestContext, logAuditEvent } from "../utils/auditLogger.js";
import { sendSafeErrorResponse } from "../utils/errorResponder.js";

function parseId(idParam, label) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return id;
}

function getStatusCode(message) {
  const normalized = String(message || "").toLowerCase();

  if (message === "Unauthorized") {
    return 401;
  }

  if (
    message === "Forbidden" ||
    message.includes("cannot approve your own leave") ||
    message.includes("cannot reject your own leave") ||
    message.startsWith("Only ") ||
    message.startsWith("Dean can only")
  ) {
    return 403;
  }

  if (
    normalized === "leave not found" ||
    normalized.endsWith("not found") ||
    normalized.includes("not found")
  ) {
    return 404;
  }

  if (normalized.includes("too many")) {
    return 429;
  }

  if (
    normalized.includes("required") ||
    normalized.includes("invalid") ||
    normalized.includes("cannot") ||
    normalized.includes("must") ||
    normalized.includes("exceeded") ||
    normalized.includes("exhausted")
  ) {
    return 400;
  }

  return 500;
}

function handleError(req, res, error, fallbackMessage, logEvent) {
  return sendSafeErrorResponse(res, error, {
    fallbackMessage,
    statusCodeResolver: getStatusCode,
    logEvent,
    logMeta: {
      ...getRequestContext(req),
      userId: req.user?.id,
      role: req.user?.role,
    },
  });
}

export async function applyLeave(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff can apply for leave",
      });
    }

    const attachmentPath = req.file
      ? "uploads/" + req.file.filename
      : undefined;
    const leave = await applyLeaveService(req.user.id, {
      fromDate: req.body?.fromDate,
      toDate: req.body?.toDate,
      reason: req.body?.reason,
      isHalfDay: req.body?.isHalfDay,
      halfDayType: req.body?.halfDayType,
      attachment: attachmentPath,
    });

    logAuditEvent("leave.applied", {
      ...getRequestContext(req),
      userId: req.user.id,
      leaveId: leave.id,
      totalDays: leave.totalDays,
      status: leave.status,
    });

    return res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to apply leave",
      "leave.apply.error",
    );
  }
}

export async function approveByDean(req, res) {
  try {
    const leaveId = parseId(req.params.id, "leave");
    const leave = await approveByDeanService(leaveId, req.user);

    logAuditEvent("leave.approved", {
      ...getRequestContext(req),
      deanId: req.user?.id,
      leaveId: leave.id,
      applicantId: leave.userId,
    });

    return res.status(200).json({
      message: "Leave approved by dean",
      leave,
    });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to approve leave",
      "leave.approve.error",
    );
  }
}

export async function rejectByDean(req, res) {
  try {
    const leaveId = parseId(req.params.id, "leave");
    const leave = await rejectByDeanService(
      leaveId,
      req.body?.reason,
      req.user,
    );

    logAuditEvent("leave.rejected", {
      ...getRequestContext(req),
      deanId: req.user?.id,
      leaveId: leave.id,
      applicantId: leave.userId,
      hasReason: Boolean(leave.rejectionReason),
    });

    return res.status(200).json({
      message: "Leave rejected by dean",
      leave,
    });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to reject leave",
      "leave.reject.error",
    );
  }
}

export async function getMyLeaveHistory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const leaves = await getMyLeaveHistoryService(req.user.id);

    return res.status(200).json({ leaves });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch leave history",
      "leave.history.error",
    );
  }
}

export async function getMyLeaveBalance(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const balance = await getMyLeaveBalanceService(req.user.id);

    return res.status(200).json({ balance });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch leave balance",
      "leave.balance.error",
    );
  }
}

export async function getMonthlyLeaveSummary(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const summary = await getMonthlyLeaveSummaryService(req.user.id);
    return res.status(200).json({ summary });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch monthly leave summary",
      "leave.monthly_summary.error",
    );
  }
}

export async function getPendingLeavesForDean(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const leaves = await getPendingLeavesForDeanService(req.user);

    return res.status(200).json({ leaves });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch pending leaves",
      "leave.pending_dean.error",
    );
  }
}

export async function getPendingLeaves(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const leaves = await getPendingLeavesService(req.user);
    return res.status(200).json({ leaves });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch pending leaves",
      "leave.pending.error",
    );
  }
}

export async function getDeanDashboardOverview(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const overview = await getDeanDashboardOverviewService(req.user);
    return res.status(200).json(overview);
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch dean dashboard overview",
      "leave.dean_overview.error",
    );
  }
}

export async function getLeaveUserDetailsForDean(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = parseId(req.params.id, "user");
    const details = await getLeaveUserDetailsForDeanService(userId, req.user);

    return res.status(200).json(details);
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch leave user details",
      "leave.dean_user_details.error",
    );
  }
}
