import {
  changePassword as changePasswordService,
  getCurrentUser,
  loginUser,
} from "../services/auth.service.js";
import {
  getRequestContext,
  logAuditEvent,
  logSecurityEvent,
} from "../utils/auditLogger.js";
import { sendSafeErrorResponse } from "../utils/errorResponder.js";
import { normalizeEmail } from "../utils/inputValidator.js";

function getAuthStatusCode(message) {
  const normalized = String(message || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return 500;
  }

  if (normalized === "unauthorized" || normalized === "invalid credentials") {
    return 401;
  }

  if (normalized.includes("too many")) {
    return 429;
  }

  if (normalized.includes("not found")) {
    return 404;
  }

  if (
    normalized.includes("required") ||
    normalized.includes("invalid") ||
    normalized.includes("must") ||
    normalized.includes("incorrect") ||
    normalized.includes("do not match")
  ) {
    return 400;
  }

  return 500;
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);

  try {
    const password = String(req.body?.password || "");

    if (!email || !password) {
      logSecurityEvent("auth.login.failed", {
        ...getRequestContext(req),
        email,
        reason: "missing_credentials",
      });

      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await loginUser(email, password);

    logAuditEvent("auth.login.success", {
      ...getRequestContext(req),
      userId: result.user.id,
      role: result.user.role,
      email,
    });

    return res.status(200).json(result);
  } catch (error) {
    logSecurityEvent("auth.login.failed", {
      ...getRequestContext(req),
      email,
      reason: error?.message || "unknown",
    });

    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Login failed",
      statusCodeResolver: getAuthStatusCode,
      logEvent: "auth.login.error",
      logMeta: {
        ...getRequestContext(req),
        email,
      },
    });
  }
}

export async function me(req, res) {
  try {
    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({ user });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Unable to fetch user",
      statusCodeResolver: getAuthStatusCode,
      logEvent: "auth.me.error",
      logMeta: {
        ...getRequestContext(req),
        userId: req.user?.id,
      },
    });
  }
}

export async function changePassword(req, res) {
  try {
    const result = await changePasswordService(req.user.id, req.body);

    logAuditEvent("auth.password.changed", {
      ...getRequestContext(req),
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Password changed successfully",
      user: result.user,
    });
  } catch (error) {
    return sendSafeErrorResponse(res, error, {
      fallbackMessage: "Unable to change password",
      statusCodeResolver: getAuthStatusCode,
      logEvent: "auth.change_password.error",
      logMeta: {
        ...getRequestContext(req),
        userId: req.user?.id,
      },
    });
  }
}
