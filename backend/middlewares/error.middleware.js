import { logErrorEvent } from "../utils/auditLogger.js";

export function notFoundHandler(_req, res) {
  return res.status(404).json({
    message: "Resource not found",
  });
}

export function globalErrorHandler(error, req, res, _next) {
  const statusCode =
    Number.isInteger(error?.statusCode) && error.statusCode >= 400
      ? error.statusCode
      : Number.isInteger(error?.status) && error.status >= 400
        ? error.status
        : 500;

  const isCorsError = error?.message === "CORS_NOT_ALLOWED";
  const responseStatus = isCorsError ? 403 : statusCode;

  const message =
    responseStatus >= 500
      ? "Internal server error"
      : isCorsError
        ? "Request blocked by security policy"
        : "Request failed";

  if (responseStatus >= 500 || isCorsError) {
    logErrorEvent("api.unhandled_error", {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      statusCode: responseStatus,
      errorName: error?.name || "Error",
      message: error?.message || "unknown",
    });
  }

  return res.status(responseStatus).json({ message });
}
