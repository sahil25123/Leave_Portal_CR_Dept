import {
  applyLeave as applyLeaveService,
  approveByDean as approveByDeanService,
  getDeanDashboardOverview as getDeanDashboardOverviewService,
  getLeaveUserDetailsForDean as getLeaveUserDetailsForDeanService,
  getMyLeaveBalance as getMyLeaveBalanceService,
  getMyLeaveHistory as getMyLeaveHistoryService,
  getPendingLeaves as getPendingLeavesService,
  getPendingLeavesForDean as getPendingLeavesForDeanService,
  rejectByDean as rejectByDeanService,
} from "../services/leave.service.js";

function parseId(idParam, label) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return id;
}

function getStatusCode(message) {
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
    message === "Leave not found" ||
    message.endsWith("not found") ||
    message.includes("not found")
  ) {
    return 404;
  }

  return 400;
}

function handleError(res, error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  return res.status(getStatusCode(message)).json({ message });
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

    const leave = await applyLeaveService(req.user.id, req.body);

    return res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    return handleError(res, error, "Failed to apply leave");
  }
}

export async function approveByDean(req, res) {
  try {
    const leaveId = parseId(req.params.id, "leave");
    const leave = await approveByDeanService(leaveId, req.user);

    return res.status(200).json({
      message: "Leave approved by dean",
      leave,
    });
  } catch (error) {
    return handleError(res, error, "Failed to approve leave");
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

    return res.status(200).json({
      message: "Leave rejected by dean",
      leave,
    });
  } catch (error) {
    return handleError(res, error, "Failed to reject leave");
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
    return handleError(res, error, "Failed to fetch leave history");
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
    return handleError(res, error, "Failed to fetch leave balance");
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
    return handleError(res, error, "Failed to fetch pending leaves");
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
    return handleError(res, error, "Failed to fetch pending leaves");
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
    return handleError(res, error, "Failed to fetch dean dashboard overview");
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
    return handleError(res, error, "Failed to fetch leave user details");
  }
}
