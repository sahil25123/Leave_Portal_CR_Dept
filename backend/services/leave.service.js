import prisma from "../config/prisma.js";
import { calculateLeaveDays, toDateOnly } from "../utils/leaveCalculator.js";

function parseAndValidateDates(fromDate, toDate) {
  const parsedFromDate = toDateOnly(fromDate);
  const parsedToDate = toDateOnly(toDate);

  if (!parsedFromDate || !parsedToDate || parsedFromDate > parsedToDate) {
    throw new Error("Invalid date range");
  }

  return { parsedFromDate, parsedToDate };
}

export async function applyLeave(userId, data) {
  const { fromDate, toDate, reason, isHalfDay = false, attachment } = data;

  if (!fromDate || !toDate || !reason || !String(reason).trim()) {
    throw new Error("fromDate, toDate and reason are required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const { parsedFromDate, parsedToDate } = parseAndValidateDates(
    fromDate,
    toDate,
  );
  const isHalfDayLeave = isHalfDay === true;

  if (isHalfDayLeave && parsedFromDate.getTime() !== parsedToDate.getTime()) {
    throw new Error("Half day only allowed for single day");
  }

  const holidays = await prisma.holiday.findMany({
    select: { date: true },
  });

  const totalDays = calculateLeaveDays(
    parsedFromDate,
    parsedToDate,
    holidays,
    isHalfDayLeave,
  );

  if (totalDays === 0) {
    throw new Error("No working days available in selected range");
  }

  const leaveYear = parsedFromDate.getUTCFullYear();
  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      userId_year: {
        userId,
        year: leaveYear,
      },
    },
    select: {
      remaining: true,
    },
  });

  if (!leaveBalance || leaveBalance.remaining < totalDays) {
    throw new Error("Insufficient leave balance");
  }

  const dean = await prisma.user.findFirst({
    where: {
      role: "dean",
    },
    select: {
      id: true,
    },
  });

  if (!dean) {
    throw new Error("Dean user not found");
  }

  const leave = await prisma.$transaction(async (tx) => {
    const createdLeave = await tx.leave.create({
      data: {
        userId,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
        totalDays,
        reason: String(reason).trim(),
        isHalfDay: isHalfDayLeave,
        attachment: attachment || null,
        status: "pending_dean",
        deanApproved: false,
        hodApproved: false,
      },
    });

    await tx.notification.create({
      data: {
        userId: dean.id,
        title: "New Leave Request",
        message: "A staff member applied for leave",
        type: "leave_applied",
        leaveId: createdLeave.id,
      },
    });

    return createdLeave;
  });

  return leave;
}
