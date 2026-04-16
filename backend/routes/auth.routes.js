import { Router } from "express";
import { changePassword, login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/change-password", authenticate, changePassword);

export default router;
