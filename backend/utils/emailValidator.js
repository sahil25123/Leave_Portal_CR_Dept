const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || ""));
}

export function validateEmail(email) {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email address");
  }
}
