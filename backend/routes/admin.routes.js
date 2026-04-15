import { Router } from "express";
import {
  createUser,
  getAllLeavesForAdmin,
  getUsers,
  updateUser,
} from "../controllers/admin.controller.js";
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

router.get(
  "/leave/all",
  authenticate,
  authorizeRoles("admin"),
  getAllLeavesForAdmin,
);

export default router;
