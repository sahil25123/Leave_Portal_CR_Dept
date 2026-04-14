import { Router } from "express";
import { applyLeave } from "../controllers/leave.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/apply", authenticate, applyLeave);

export default router;
