import {
  createUser as createUserService,
  getAllUsers as getAllUsersService,
  updateUser as updateUserService,
} from "../services/admin.service.js";
import { getAllLeavesForAdmin as getAllLeavesForAdminService } from "../services/leave.service.js";

function parseId(rawId, label) {
  const parsedId = Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return parsedId;
}

function getStatusCode(message) {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.endsWith("not found") || message.includes("not found")) {
    return 404;
  }

  return 400;
}

function handleError(res, error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  const statusCode = getStatusCode(message);

  return res.status(statusCode).json({ message });
}

export async function getUsers(req, res) {
  try {
    const users = await getAllUsersService(req.user);
    return res.status(200).json({ users });
  } catch (error) {
    return handleError(res, error, "Failed to fetch users");
  }
}

export async function createUser(req, res) {
  try {
    const user = await createUserService(req.user, req.body);
    return res.status(201).json({ message: "User created", user });
  } catch (error) {
    return handleError(res, error, "Failed to create user");
  }
}

export async function updateUser(req, res) {
  try {
    const userId = parseId(req.params.id, "user");
    const user = await updateUserService(req.user, userId, req.body);
    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    return handleError(res, error, "Failed to update user");
  }
}

export async function getAllLeavesForAdmin(req, res) {
  try {
    const leaves = await getAllLeavesForAdminService(req.user);
    return res.status(200).json({ leaves });
  } catch (error) {
    return handleError(res, error, "Failed to fetch all leaves");
  }
}
