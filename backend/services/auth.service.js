import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { jwtSecret, jwtExpiresIn } from "../config/jwt.config.js";
import { normalizeEmail, validateEmail } from "../utils/emailValidator.js";
import {
  generateResetToken,
  hashResetToken,
  isResetTokenExpired,
} from "../utils/resetPasswordToken.js";
import { validateStrongPassword } from "../utils/passwordValidator.js";
import { sendPasswordResetEmail } from "./email.service.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function buildResetPasswordUrl(token) {
  const baseUrl = String(FRONTEND_URL || "http://localhost:5173").replace(
    /\/+$/,
    "",
  );

  return baseUrl + "/reset-password?token=" + encodeURIComponent(token);
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

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
  const oldPassword = String(payload?.oldPassword || "").trim();
  const newPassword = String(payload?.newPassword || "").trim();
  const confirmPassword = String(payload?.confirmPassword || "").trim();

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
      resetPasswordToken: null,
      resetPasswordExpiry: null,
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

export async function forgotPassword(payload) {
  const email = normalizeEmail(payload?.email);

  if (!email) {
    throw new Error("Email is required");
  }

  validateEmail(email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (user) {
    const { token, tokenHash } = generateResetToken();
    const resetPasswordExpiry = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiry,
      },
    });

    try {
      await sendPasswordResetEmail({
        user,
        resetUrl: buildResetPasswordUrl(token),
      });
    } catch (error) {
      console.error(
        "[email] Password reset email dispatch failed:",
        error?.message || error,
      );
    }
  }

  return {
    message: "If the email exists, a reset link has been sent.",
  };
}

export async function validateResetToken(token) {
  const normalizedToken = String(token || "").trim();

  if (!normalizedToken) {
    throw new Error("Reset token is required");
  }

  const tokenHash = hashResetToken(normalizedToken);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: tokenHash,
    },
    select: {
      id: true,
      resetPasswordExpiry: true,
    },
  });

  if (!user || isResetTokenExpired(user.resetPasswordExpiry)) {
    throw new Error("Reset token is invalid or expired");
  }

  return { valid: true };
}

export async function resetPassword(payload) {
  const token = String(payload?.token || "").trim();
  const newPassword = String(payload?.newPassword || "").trim();
  const confirmPassword = String(payload?.confirmPassword || "").trim();

  if (!token || !newPassword || !confirmPassword) {
    throw new Error("token, newPassword and confirmPassword are required");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match");
  }

  validateStrongPassword(newPassword);

  const tokenHash = hashResetToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: tokenHash,
    },
    select: {
      id: true,
      email: true,
      resetPasswordExpiry: true,
    },
  });

  if (!user || isResetTokenExpired(user.resetPasswordExpiry)) {
    throw new Error("Reset token is invalid or expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    },
  });

  return { message: "Password reset successfully" };
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
