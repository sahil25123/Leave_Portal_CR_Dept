import prisma from "../config/prisma.js";
import { toDateOnly } from "../utils/leaveValidator.js";

function assertAdmin(user) {
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
}

function normalizeLimit(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid leave limits");
  }

  return Number(parsed.toFixed(2));
}

function parseYearPayload(payload) {
  const name = String(payload?.name || "").trim();
  const startDate = toDateOnly(payload?.startDate);
  const endDate = toDateOnly(payload?.endDate);
  const monthlyLimit = normalizeLimit(payload?.monthlyLimit, 2.5);
  const yearlyLimit = normalizeLimit(payload?.yearlyLimit, 30);

  if (!name || !startDate || !endDate) {
    throw new Error("name, startDate and endDate are required");
  }

  if (startDate > endDate) {
    throw new Error("startDate must be before or equal to endDate");
  }

  return {
    name,
    startDate,
    endDate,
    monthlyLimit,
    yearlyLimit,
  };
}

function toLeaveYearResponse(leaveYear) {
  return {
    id: leaveYear.id,
    name: leaveYear.name,
    startDate: leaveYear.startDate,
    endDate: leaveYear.endDate,
    isActive: leaveYear.isActive,
    monthlyLimit: leaveYear.monthlyLimit,
    yearlyLimit: leaveYear.yearlyLimit,
    createdAt: leaveYear.createdAt,
  };
}

export async function getActiveYear() {
  const activeYear = await prisma.leaveYear.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!activeYear) {
    throw new Error("Active leave year not configured");
  }

  return activeYear;
}

export async function getActiveYearOrNull() {
  return prisma.leaveYear.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function listLeaveYears(currentUser) {
  assertAdmin(currentUser);

  const leaveYears = await prisma.leaveYear.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return leaveYears.map(toLeaveYearResponse);
}

export async function createLeaveYear(currentUser, payload) {
  assertAdmin(currentUser);

  const data = parseYearPayload(payload);

  const createdYear = await prisma.leaveYear.create({
    data,
  });

  return toLeaveYearResponse(createdYear);
}

export async function ensureLeaveBalanceForYear(
  userId,
  leaveYear,
  tx = prisma,
) {
  const balanceYear = leaveYear.startDate.getUTCFullYear();
  const existingBalance = await tx.leaveBalance.findUnique({
    where: {
      userId_yearId: {
        userId,
        yearId: leaveYear.id,
      },
    },
    select: {
      id: true,
      used: true,
    },
  });

  if (!existingBalance) {
    return tx.leaveBalance.create({
      data: {
        userId,
        yearId: leaveYear.id,
        year: balanceYear,
        total: leaveYear.yearlyLimit,
        used: 0,
        remaining: leaveYear.yearlyLimit,
      },
      select: {
        id: true,
        userId: true,
        yearId: true,
        year: true,
        total: true,
        used: true,
        remaining: true,
      },
    });
  }

  const used = Number(existingBalance.used || 0);
  const remaining = Number(
    Math.max(Number(leaveYear.yearlyLimit) - used, 0).toFixed(2),
  );

  return tx.leaveBalance.update({
    where: {
      id: existingBalance.id,
    },
    data: {
      year: balanceYear,
      total: leaveYear.yearlyLimit,
      remaining,
    },
    select: {
      id: true,
      userId: true,
      yearId: true,
      year: true,
      total: true,
      used: true,
      remaining: true,
    },
  });
}

export async function activateLeaveYear(currentUser, yearId) {
  assertAdmin(currentUser);

  const parsedYearId = Number(yearId);

  if (!Number.isInteger(parsedYearId) || parsedYearId <= 0) {
    throw new Error("Invalid year id");
  }

  return prisma.$transaction(async (tx) => {
    const existingYear = await tx.leaveYear.findUnique({
      where: { id: parsedYearId },
    });

    if (!existingYear) {
      throw new Error("Leave year not found");
    }

    await tx.leaveYear.updateMany({
      data: {
        isActive: false,
      },
    });

    const activeYear = await tx.leaveYear.update({
      where: {
        id: parsedYearId,
      },
      data: {
        isActive: true,
      },
    });

    const users = await tx.user.findMany({
      select: {
        id: true,
      },
    });

    for (const user of users) {
      await ensureLeaveBalanceForYear(user.id, activeYear, tx);
    }

    return toLeaveYearResponse(activeYear);
  });
}
