import rateLimit from "express-rate-limit";

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const authWindowMs = parsePositiveInteger(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);

const loginMaxAttempts = parsePositiveInteger(
  process.env.LOGIN_RATE_LIMIT_MAX,
  5,
);

const changePasswordMaxAttempts = parsePositiveInteger(
  process.env.CHANGE_PASSWORD_RATE_LIMIT_MAX,
  10,
);

const apiWindowMs = parsePositiveInteger(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);

const apiMaxRequests = parsePositiveInteger(
  process.env.API_RATE_LIMIT_MAX,
  300,
);

function createLimiter(options) {
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...options,
    handler: (_req, res) => {
      return res.status(429).json({
        message: options.message,
      });
    },
  });
}

export const apiRateLimiter = createLimiter({
  windowMs: apiWindowMs,
  max: apiMaxRequests,
  message: "Too many requests. Please try again later.",
});

export const loginRateLimiter = createLimiter({
  windowMs: authWindowMs,
  max: loginMaxAttempts,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please try again later.",
});

export const changePasswordRateLimiter = createLimiter({
  windowMs: authWindowMs,
  max: changePasswordMaxAttempts,
  message: "Too many password change attempts. Please try again later.",
});
