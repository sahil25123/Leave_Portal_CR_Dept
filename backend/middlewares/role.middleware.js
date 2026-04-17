import { assertValidRole, normalizeRole } from "../utils/inputValidator.js";

export function authorizeRoles(...roles) {
  const normalizedAllowedRoles = roles.map(normalizeRole);

  for (const role of normalizedAllowedRoles) {
    assertValidRole(role, "Invalid role authorization configuration");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    return next();
  };
}
