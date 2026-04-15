import { Router } from "express";
import {
  applyLeave,
  approveByDean,
  getMyLeaveBalance,
  getMyLeaveHistory,
  getPendingLeavesForDean,
  rejectByDean,
} from "../controllers/leave.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/apply", authenticate, applyLeave);
router.get("/history/me", authenticate, getMyLeaveHistory);
router.get("/balance/me", authenticate, getMyLeaveBalance);
router.get(
  "/pending/dean",
  authenticate,
  authorizeRoles("dean"),
  getPendingLeavesForDean,
);
router.post(
  "/approve/dean/:id",
  authenticate,
  authorizeRoles("dean"),
  approveByDean,
);
router.post(
  "/reject/dean/:id",
  authenticate,
  authorizeRoles("dean"),
  rejectByDean,
);

export default router;
