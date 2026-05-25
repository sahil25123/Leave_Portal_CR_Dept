import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/jwt.config.js";

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];
  return token || null
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

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      !decoded.role
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}
