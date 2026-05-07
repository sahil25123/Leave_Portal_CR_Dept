import { Router } from "express";
import {
  createUser,
  getAllLeavesForAdmin,
  getUsers,
  resetUserPassword,
  updateUser,
} from "../controllers/admin.controller.js";
import {
  activateLeaveYear,
  createLeaveYear,
  getActiveLeaveYear,
  getLeaveYears,
} from "../controllers/year.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/users", authenticate, authorizeRoles("admin"), getUsers);
router.post("/admin/users", authenticate, authorizeRoles("admin"), createUser);
router.put(
  "/admin/users/:id",
  authenticate,
  authorizeRoles("admin"),
  updateUser,
);
router.put(
  "/admin/users/:id/reset-password",
  authenticate,
  authorizeRoles("admin"),
  resetUserPassword,
);

router.get(
  "/leave/all",
  authenticate,
  authorizeRoles("admin"),
  getAllLeavesForAdmin,
);

router.get("/admin/year", authenticate, authorizeRoles("admin"), getLeaveYears);
router.get(
  "/admin/year/active",
  authenticate,
  authorizeRoles("admin"),
  getActiveLeaveYear,
);
router.post(
  "/admin/year",
  authenticate,
  authorizeRoles("admin"),
  createLeaveYear,
);
router.put(
  "/admin/year/:id/activate",
  authenticate,
  authorizeRoles("admin"),
  activateLeaveYear,
);

export default router;
