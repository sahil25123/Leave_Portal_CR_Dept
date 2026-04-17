const MASKED_VALUE = "[redacted]";
const SENSITIVE_KEY_PATTERN =
  /password|secret|token|authorization|cookie|pass|key/i;

function sanitizeValue(value, depth = 0) {
  if (depth > 4) {
    return "[max-depth]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = MASKED_VALUE;
        continue;
      }

      sanitized[key] = sanitizeValue(nestedValue, depth + 1);
    }

    return sanitized;
  }

  if (typeof value === "string" && value.length > 500) {
    return value.slice(0, 500) + "...";
  }

  return value;
}

function writeLog(level, event, metadata = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    metadata: sanitizeValue(metadata),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function logAuditEvent(event, metadata = {}) {
  writeLog("info", event, metadata);
}

export function logSecurityEvent(event, metadata = {}) {
  writeLog("warn", event, metadata);
}

export function logErrorEvent(event, metadata = {}) {
  writeLog("error", event, metadata);
}

export function getRequestContext(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    userAgent: req.headers["user-agent"] || "",
  };
}
