import {
  createUser as createUserService,
  getAllUsers as getAllUsersService,
  updateUser as updateUserService,
} from "../services/admin.service.js";
import { getAllLeavesForAdmin as getAllLeavesForAdminService } from "../services/leave.service.js";
import { getRequestContext, logAuditEvent } from "../utils/auditLogger.js";
import { sendSafeErrorResponse } from "../utils/errorResponder.js";

function parseId(rawId, label) {
  const parsedId = Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return parsedId;
}

export async function getUsers(req, res) {
  try {
    const users = await getAllUsersService(req.user);

    logAuditEvent("admin.users.viewed", {
      ...getRequestContext(req),
      adminId: req.user?.id,
      count: users.length,
    });

    return res.status(200).json({ users });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Failed to fetch users",
      logEvent: "admin.users.view.error",
      logMeta: {
        ...getRequestContext(req),
        adminId: req.user?.id,
      },
    });
  }
}

export async function createUser(req, res) {
  try {
    const user = await createUserService(req.user, req.body);

    logAuditEvent("admin.user.created", {
      ...getRequestContext(req),
      adminId: req.user?.id,
      targetUserId: user.id,
      targetEmail: user.email,
      targetRole: user.role,
    });

    return res.status(201).json({ message: "User created", user });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Failed to create user",
      logEvent: "admin.user.create.error",
      logMeta: {
        ...getRequestContext(req),
        adminId: req.user?.id,
      },
    });
  }
}

export async function updateUser(req, res) {
  try {
    const userId = parseId(req.params.id, "user");
    const user = await updateUserService(req.user, userId, req.body);

    logAuditEvent("admin.user.updated", {
      ...getRequestContext(req),
      adminId: req.user?.id,
      targetUserId: user.id,
      targetEmail: user.email,
      targetRole: user.role,
    });

    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Failed to update user",
      logEvent: "admin.user.update.error",
      logMeta: {
        ...getRequestContext(req),
        adminId: req.user?.id,
      },
    });
  }
}

export async function getAllLeavesForAdmin(req, res) {
  try {
    const leaves = await getAllLeavesForAdminService(req.user);

    logAuditEvent("admin.leaves.viewed", {
      ...getRequestContext(req),
      adminId: req.user?.id,
      count: leaves.length,
    });

    return res.status(200).json({ leaves });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Failed to fetch all leaves",
      logEvent: "admin.leaves.view.error",
      logMeta: {
        ...getRequestContext(req),
        adminId: req.user?.id,
      },
    });
  }
}
