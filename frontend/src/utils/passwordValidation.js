export const PASSWORD_VALIDATION_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function isStrongPassword(password) {
  return PASSWORD_POLICY_REGEX.test(String(password || ""));
}

export function getPasswordValidationMessage(password) {
  const normalizedPassword = String(password || "");

  if (!normalizedPassword) {
    return "Password is required";
  }

  if (!isStrongPassword(normalizedPassword)) {
    return PASSWORD_VALIDATION_MESSAGE;
  }

  return "";
}
