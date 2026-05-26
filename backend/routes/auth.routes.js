import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  resetPassword,
  validateResetToken,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { forgotPasswordLimiter } from "../middlewares/authRateLimit.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/validate-reset-token", validateResetToken);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);
router.post("/change-password", authenticate, changePassword);

export default router;
