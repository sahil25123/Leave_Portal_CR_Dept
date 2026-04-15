import { Router } from "express";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  syncHolidayCalendar,
  updateHoliday,
} from "../controllers/holiday.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/holidays", authenticate, authorizeRoles("admin"), getHolidays);
router.post(
  "/holidays/sync",
  authenticate,
  authorizeRoles("admin"),
  syncHolidayCalendar,
);
router.post("/holidays", authenticate, authorizeRoles("admin"), createHoliday);
router.put(
  "/holidays/:id",
  authenticate,
  authorizeRoles("admin"),
  updateHoliday,
);
router.delete(
  "/holidays/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteHoliday,
);

export default router;
