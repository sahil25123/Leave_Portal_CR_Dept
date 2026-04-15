import { Router } from "express";
import {
  applyLeave,
  approveByDean,
  getDeanDashboardOverview,
  getLeaveUserDetailsForDean,
  getMyLeaveBalance,
  getMyLeaveHistory,
  getPendingLeaves,
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
  "/dean/overview",
  authenticate,
  authorizeRoles("dean"),
  getDeanDashboardOverview,
);
router.get("/pending", authenticate, authorizeRoles("dean"), getPendingLeaves);
router.get(
  "/pending/dean",
  authenticate,
  authorizeRoles("dean"),
  getPendingLeavesForDean,
);
router.get(
  "/user/:id",
  authenticate,
  authorizeRoles("dean"),
  getLeaveUserDetailsForDean,
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
