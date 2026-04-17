const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(["admin", "dean", "staff"]);

export function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function assertValidEmail(value, message = "Invalid email") {
  if (!isValidEmail(value)) {
    throw new Error(message);
  }
}

export function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidRole(value) {
  return ALLOWED_ROLES.has(normalizeRole(value));
}

export function assertValidRole(value, message = "Invalid role") {
  if (!isValidRole(value)) {
    throw new Error(message);
  }
}
