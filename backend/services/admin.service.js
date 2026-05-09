import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import {
  ensureLeaveBalanceForYear,
  getActiveYearOrNull,
} from "./year.service.js";
import {
  normalizeEmail,
  validateEmail,
} from "../utils/emailValidator.js";
import { validateStrongPassword } from "../utils/passwordValidator.js";
import {
  sendAdminEmailUpdatedNotification,
  sendAdminPasswordResetEmail,
} from "./email.service.js";

const ALLOWED_ROLES = new Set(["staff", "dean", "admin"]);
const SALT_ROUNDS = 10;

function assertAdmin(user) {
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
}

function parseUserRole(role) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    throw new Error("Invalid role");
  }

  return normalizedRole;
}

export async function getAllUsers(currentUser) {
  assertAdmin(currentUser);

  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
}

export async function createUser(currentUser, payload) {
  assertAdmin(currentUser);

  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "").trim();
  const designation = String(payload?.designation || "").trim();
  const role = parseUserRole(payload?.role);

  if (!name || !email || !password || !designation) {
    throw new Error("name, email, password, role and designation are required");
  }

  validateEmail(email);
  validateStrongPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      designation,
      mustChangePassword: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  const activeYear = await getActiveYearOrNull();

  if (activeYear) {
    await ensureLeaveBalanceForYear(user.id, activeYear);
  }

  return user;
}

export async function updateUser(currentUser, userId, payload) {
  assertAdmin(currentUser);

  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const designation = String(payload?.designation || "").trim();
  const role = parseUserRole(payload?.role);

  if (!name || !designation || !email) {
    throw new Error("name, email, role and designation are required");
  }

  validateEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const shouldNotifyEmailChange = email !== existingUser.email;

  if (shouldNotifyEmailChange) {
    const emailOwner = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role,
      designation,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  if (shouldNotifyEmailChange) {
    try {
      await sendAdminEmailUpdatedNotification({ user: updatedUser });
    } catch (error) {
      console.error(
        "[email] Admin email update notification failed:",
        error?.message || error,
      );
    }
  }

  return updatedUser;
}

export async function resetUserPassword(currentUser, userId, payload) {
  assertAdmin(currentUser);

  const newPassword = String(payload?.newPassword || "").trim();
  const confirmPassword = String(payload?.confirmPassword || "").trim();

  if (!newPassword || !confirmPassword) {
    throw new Error("newPassword and confirmPassword are required");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match");
  }

  validateStrongPassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: true,
    },
  });

  try {
    await sendAdminPasswordResetEmail({ user });
  } catch (error) {
    console.error(
      "[email] Admin password reset notification failed:",
      error?.message || error,
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation,
    mustChangePassword: true,
  };
}
