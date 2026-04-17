import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { logAuditEvent, logSecurityEvent } from "./utils/auditLogger.js";

dotenv.config();

const app = express();
const uploadDirectory = path.join(process.cwd(), "uploads");
const allowedUploadExtensions = new Set([".pdf", ".doc", ".docx"]);

function parseAllowedOrigins() {
  const values = [process.env.FRONTEND_URL, process.env.FRONTEND_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(values);
}

function enforceHttpsInProduction(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (req.secure || forwardedProtocol === "https") {
    return next();
  }

  if (!req.headers.host) {
    return res.status(400).json({
      message: "HTTPS is required",
    });
  }

  const redirectUrl = "https://" + req.headers.host + req.originalUrl;
  return res.redirect(301, redirectUrl);
}

const allowedOrigins = parseAllowedOrigins();

if (process.env.NODE_ENV === "production" && allowedOrigins.size === 0) {
  throw new Error("FRONTEND_URL or FRONTEND_ORIGINS must be configured");
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    logSecurityEvent("security.cors_blocked", {
      origin,
    });

    const corsError = new Error("CORS_NOT_ALLOWED");
    corsError.statusCode = 403;
    return callback(corsError);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  optionsSuccessStatus: 204,
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(cors(corsOptions));
app.use(enforceHttpsInProduction);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use((req, _res, next) => {
  req.requestStartedAt = Date.now();
  next();
});

app.use("/api", apiRateLimiter);

app.use(
  "/uploads",
  (req, res, next) => {
    const extension = path.extname(String(req.path || "")).toLowerCase();

    if (!allowedUploadExtensions.has(extension)) {
      return res.status(404).json({
        message: "Resource not found",
      });
    }

    return next();
  },
  express.static(uploadDirectory, {
    index: false,
    dotfiles: "deny",
    fallthrough: false,
    redirect: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, max-age=3600");
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api", adminRoutes);
app.use("/api", holidayRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "API Running",
  });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logAuditEvent("server.started", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: [...allowedOrigins],
  });
});
