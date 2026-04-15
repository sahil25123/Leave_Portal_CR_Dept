import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

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
      createdAt: true,
    },
  });
}

export async function createUser(currentUser, payload) {
  assertAdmin(currentUser);

  const name = String(payload?.name || "").trim();
  const email = String(payload?.email || "")
    .trim()
    .toLowerCase();
  const password = String(payload?.password || "").trim();
  const designation = String(payload?.designation || "").trim();
  const role = parseUserRole(payload?.role);

  if (!name || !email || !password || !designation) {
    throw new Error("name, email, password, role and designation are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      designation,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      createdAt: true,
    },
  });

  const currentYear = new Date().getUTCFullYear();

  await prisma.leaveBalance.upsert({
    where: {
      userId_year: {
        userId: user.id,
        year: currentYear,
      },
    },
    update: {
      total: 30,
      used: 0,
      remaining: 30,
    },
    create: {
      userId: user.id,
      year: currentYear,
      total: 30,
      used: 0,
      remaining: 30,
    },
  });

  return user;
}

export async function updateUser(currentUser, userId, payload) {
  assertAdmin(currentUser);

  const name = String(payload?.name || "").trim();
  const designation = String(payload?.designation || "").trim();
  const role = parseUserRole(payload?.role);

  if (!name || !designation) {
    throw new Error("name, role and designation are required");
  }

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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      role,
      designation,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      createdAt: true,
    },
  });

  return updatedUser;
}

export async function getHolidays(currentUser) {
  assertAdmin(currentUser);

  return prisma.holiday.findMany({
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      name: true,
      date: true,
      createdAt: true,
    },
  });
}

export async function createHoliday(currentUser, payload) {
  assertAdmin(currentUser);

  const name = String(payload?.name || "").trim();
  const dateValue = payload?.date;

  if (!name || !dateValue) {
    throw new Error("name and date are required");
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid holiday date");
  }

  const holiday = await prisma.holiday.create({
    data: {
      name,
      date,
    },
    select: {
      id: true,
      name: true,
      date: true,
      createdAt: true,
    },
  });

  return holiday;
}

export async function deleteHoliday(currentUser, holidayId) {
  assertAdmin(currentUser);

  const existingHoliday = await prisma.holiday.findUnique({
    where: { id: holidayId },
    select: { id: true },
  });

  if (!existingHoliday) {
    throw new Error("Holiday not found");
  }

  await prisma.holiday.delete({
    where: { id: holidayId },
  });

  return { success: true };
}
