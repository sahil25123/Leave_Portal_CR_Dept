import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { jwtSecret, jwtExpiresIn } from "../config/jwt.config.js";
import { validateStrongPassword } from "../utils/passwordValidator.js";
import { assertValidEmail, normalizeEmail } from "../utils/inputValidator.js";

const SALT_ROUNDS = 10;

export async function loginUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password || "");

  assertValidEmail(normalizedEmail, "Invalid email");

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(plainPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
    },
  );

  return {
    token,
    requirePasswordChange: Boolean(user.mustChangePassword),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function changePassword(userId, payload) {
  const oldPassword = String(payload?.oldPassword || "");
  const newPassword = String(payload?.newPassword || "");
  const confirmPassword = String(payload?.confirmPassword || "");

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new Error(
      "oldPassword, newPassword and confirmPassword are required",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match");
  }

  validateStrongPassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordValid) {
    throw new Error("Old password is incorrect");
  }

  if (oldPassword === newPassword) {
    throw new Error("New password must be different from old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      mustChangePassword: true,
    },
  });

  return {
    user: updatedUser,
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
