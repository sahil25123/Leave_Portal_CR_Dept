import { logErrorEvent } from "./auditLogger.js";

const SAFE_ERROR_PATTERNS = [
  /required/i,
  /invalid/i,
  /unauthorized/i,
  /forbidden/i,
  /not found/i,
  /already exists/i,
  /already processed/i,
  /cannot/i,
  /must/i,
  /exceed/i,
  /exhaust/i,
  /incorrect/i,
  /do not match/i,
  /too many/i,
];

export function isSafeClientMessage(message) {
  const normalized = String(message || "").trim();

  if (!normalized || normalized.length > 180) {
    return false;
  }

  return SAFE_ERROR_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function defaultStatusCodeResolver(message) {
  const normalized = String(message || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return 500;
  }

  if (normalized === "unauthorized") {
    return 401;
  }

  if (normalized === "forbidden") {
    return 403;
  }

  if (normalized.includes("not found")) {
    return 404;
  }

  if (normalized.includes("already exists")) {
    return 409;
  }

  if (normalized.includes("too many")) {
    return 429;
  }

  if (isSafeClientMessage(normalized)) {
    return 400;
  }

  return 500;
}

export function sendSafeErrorResponse(
  res,
  error,
  {
    fallbackMessage,
    statusCodeResolver = defaultStatusCodeResolver,
    logEvent = "api.error",
    logMeta = {},
  },
) {
  const rawMessage = String(error?.message || "").trim();
  const statusCode = statusCodeResolver(rawMessage);
  const isSafeMessage = isSafeClientMessage(rawMessage);
  const message = isSafeMessage ? rawMessage : fallbackMessage;

  if (!isSafeMessage || statusCode >= 500) {
    logErrorEvent(logEvent, {
      ...logMeta,
      statusCode,
      errorName: error?.name || "Error",
      message: rawMessage || "unknown",
    });
  }

  return res.status(statusCode).json({ message });
}
