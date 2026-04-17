import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/jwt.config.js";
import { isValidRole } from "../utils/inputValidator.js";

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const parts = authorizationHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];
  return token || null;
}

export function authenticate(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = Number(decoded?.id);
    const role = String(decoded?.role || "").toLowerCase();

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !isValidRole(role)
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = {
      id: userId,
      role,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}
