import { Router } from "express";
import { changePassword, login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  changePasswordRateLimiter,
  loginRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.get("/me", authenticate, me);
router.post(
  "/change-password",
  authenticate,
  changePasswordRateLimiter,
  changePassword,
);

export default router;
