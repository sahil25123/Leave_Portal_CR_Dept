import { applyLeave as applyLeaveService } from "../services/leave.service.js";

export async function applyLeave(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (req.user.role !== "staff" && req.user.role !== "dean") {
      return res.status(403).json({
        message: "Only staff and dean can apply for leave",
      });
    }

    const leave = await applyLeaveService(req.user.id, req.body);

    return res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to apply leave",
    });
  }
}
