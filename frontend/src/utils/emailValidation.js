export const EMAIL_VALIDATION_MESSAGE = "Enter a valid email address";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || "").trim());
}

export function getEmailValidationMessage(email) {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    return "Email is required";
  }

  if (!isValidEmail(normalizedEmail)) {
    return EMAIL_VALIDATION_MESSAGE;
  }

  return "";
}
