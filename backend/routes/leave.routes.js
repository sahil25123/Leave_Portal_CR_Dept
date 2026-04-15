import { Router } from "express";
import {
	applyLeave,
	approveByDean,
	approveByHod,
	rejectByDean,
	rejectByHod,
} from "../controllers/leave.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/apply", authenticate, applyLeave);
router.post("/approve/dean/:id", authenticate, authorizeRoles("dean"), approveByDean);
router.post("/approve/hod/:id", authenticate, authorizeRoles("hod"), approveByHod);
router.post("/reject/dean/:id", authenticate, authorizeRoles("dean"), rejectByDean);
router.post("/reject/hod/:id", authenticate, authorizeRoles("hod"), rejectByHod);

export default router;
