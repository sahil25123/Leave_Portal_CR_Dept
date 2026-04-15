import { Router } from "express";
import {
  createHoliday,
  createUser,
  deleteHoliday,
  getAllLeavesForAdmin,
  getHolidayList,
  getUsers,
  updateUser,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/users", authenticate, authorizeRoles("admin"), getUsers);
router.post("/admin/users", authenticate, authorizeRoles("admin"), createUser);
router.put("/admin/users/:id", authenticate, authorizeRoles("admin"), updateUser);

router.get("/holidays", authenticate, authorizeRoles("admin"), getHolidayList);
router.post("/holidays", authenticate, authorizeRoles("admin"), createHoliday);
router.delete("/holidays/:id", authenticate, authorizeRoles("admin"), deleteHoliday);

router.get("/leave/all", authenticate, authorizeRoles("admin"), getAllLeavesForAdmin);

export default router;
