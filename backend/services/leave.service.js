import prisma from "../config/prisma.js";
import prismaPkg from "@prisma/client";
import {
  calculateWorkingDays,
  checkOverlap,
  isNonWorkingDate,
  toDateOnly,
  validateYearlyLimit,
} from "../utils/leaveValidator.js";
import {
  sendLeaveApplicationSubmittedEmails,
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
} from "./email.service.js";
import { ensureLeaveBalanceForYear, getActiveYear } from "./year.service.js";

const { NotificationType } = prismaPkg;

const NOTIFICATION_TYPE = {
  leaveApplied: NotificationType?.leave_applied || "leave_applied",
  leaveApproved: NotificationType?.leave_approved || "final_decision",
  leaveRejected: NotificationType?.leave_rejected || "final_decision",
};

function parseAndValidateDates(fromDate, toDate) {
  const parsedFromDate = toDateOnly(fromDate);
  const parsedToDate = toDateOnly(toDate);

  if (!parsedFromDate || !parsedToDate || parsedFromDate > parsedToDate) {
    throw new Error("Invalid date range");
  }

  return { parsedFromDate, parsedToDate };
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function toDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function toMonthKey(date) {
  return (
    String(date.getUTCFullYear()) +
    "-" +
    String(date.getUTCMonth() + 1).padStart(2, "0")
  );
}

function buildHolidayDateSet(holidays = []) {
  const holidaySet = new Set();

  for (const holiday of holidays) {
    const holidayDate = toDateOnly(holiday?.date ?? holiday);

    if (holidayDate) {
      holidaySet.add(toDateKey(holidayDate));
    }
  }

  return holidaySet;
}

function calculateWorkingDaysByMonthWithHolidaySet(
  fromDate,
  toDate,
  holidaySet,
  isHalfDay,
) {
  const usageByMonth = new Map();

  for (
    let cursor = new Date(fromDate);
    cursor <= toDate;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const isSunday = cursor.getUTCDay() === 0;

    if (isSunday || holidaySet.has(toDateKey(cursor))) {
      continue;
    }

    const monthKey = toMonthKey(cursor);
    const currentDays = usageByMonth.get(monthKey) || 0;
    usageByMonth.set(monthKey, currentDays + 1);
  }

  if (isHalfDay && usageByMonth.size > 0) {
    const firstMonthKey = usageByMonth.keys().next().value;
    usageByMonth.set(firstMonthKey, 0.5);
  }

  return usageByMonth;
}

function getUtcMonthRangeFromDate(referenceDate) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  return { monthStart, monthEnd };
}

function ensureDateWithinYear(fromDate, toDate, leaveYear) {
  const yearStart = toDateOnly(leaveYear.startDate);
  const yearEnd = toDateOnly(leaveYear.endDate);

  if (!yearStart || !yearEnd) {
    throw new Error("Active leave year is invalid");
  }

  if (fromDate < yearStart || toDate > yearEnd) {
    throw new Error("Leave must be within active year");
  }
}

function ensureActorRole(actor, expectedRole) {
  if (!actor || actor.role !== expectedRole) {
    throw new Error("Forbidden");
  }
}

function ensureActionAllowedOnLeave(leave, expectedStatus, actionName) {
  if (leave.status === "approved" || leave.status === "rejected") {
    throw new Error("Leave is already processed");
  }

  if (leave.status !== expectedStatus) {
    throw new Error("Leave is not pending " + actionName);
  }
}

function ensureNotSelfAction(leave, actor, actionType) {
  if (leave.userId === actor.id) {
    throw new Error("You cannot " + actionType + " your own leave");
  }
}

function getUtcMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));

  return {
    monthStart,
    monthEnd,
    nextMonthStart,
  };
}

function formatMonthLabel(referenceDate = new Date()) {
  return referenceDate.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDateIntersection(fromDate, toDate, windowStart, windowEnd) {
  const start = fromDate > windowStart ? fromDate : windowStart;
  const end = toDate < windowEnd ? toDate : windowEnd;

  if (start > end) {
    return null;
  }

  return { start, end };
}

async function getLeaveWithApplicant(leaveId) {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
        },
      },
      leaveYear: {
        select: {
          id: true,
          name: true,
          yearlyLimit: true,
          monthlyLimit: true,
        },
      },
    },
  });

  if (!leave) {
    throw new Error("Leave not found");
  }

  return leave;
}

export async function applyLeave(userId, data) {
  const {
    fromDate,
    toDate,
    reason,
    isHalfDay = false,
    halfDayType,
    attachment,
  } = data;

  if (!fromDate || !toDate || !reason || !String(reason).trim()) {
    throw new Error("fromDate, toDate and reason are required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "staff") {
    throw new Error("Only staff can apply for leave");
  }

  const activeYear = await getActiveYear();

  const { parsedFromDate, parsedToDate } = parseAndValidateDates(
    fromDate,
    toDate,
  );
  const isHalfDayLeave = parseBoolean(isHalfDay);
  const normalizedHalfDayType = isHalfDayLeave
    ? String(halfDayType || "")
        .trim()
        .toLowerCase()
    : null;

  if (isHalfDayLeave && parsedFromDate.getTime() !== parsedToDate.getTime()) {
    throw new Error("Half day only allowed for single day");
  }

  if (
    isHalfDayLeave &&
    normalizedHalfDayType !== "first_half" &&
    normalizedHalfDayType !== "second_half"
  ) {
    throw new Error("halfDayType must be first_half or second_half");
  }

  ensureDateWithinYear(parsedFromDate, parsedToDate, activeYear);

  const holidays = await prisma.holiday.findMany({
    select: { date: true },
  });

  if (
    isNonWorkingDate(parsedFromDate, holidays) ||
    isNonWorkingDate(parsedToDate, holidays)
  ) {
    throw new Error("Cannot apply leave on holiday or Sunday");
  }

  const totalDays = calculateWorkingDays(
    parsedFromDate,
    parsedToDate,
    holidays,
    isHalfDayLeave,
  );

  if (totalDays === 0) {
    throw new Error("Cannot apply leave on holiday or Sunday");
  }

  const overlappingLeaves = await prisma.leave.findMany({
    where: {
      userId,
      yearId: activeYear.id,
      status: {
        not: "rejected",
      },
      fromDate: {
        lte: parsedToDate,
      },
      toDate: {
        gte: parsedFromDate,
      },
    },
    select: {
      id: true,
      yearId: true,
      fromDate: true,
      toDate: true,
      isHalfDay: true,
      halfDayType: true,
    },
  });

  checkOverlap({
    existingLeaves: overlappingLeaves,
    newFromDate: parsedFromDate,
    newToDate: parsedToDate,
    isHalfDay: isHalfDayLeave,
    halfDayType: normalizedHalfDayType,
  });

  const leaveBalance = await ensureLeaveBalanceForYear(userId, activeYear);

  validateYearlyLimit(
    leaveBalance.remaining,
    totalDays,
    activeYear.yearlyLimit,
  );

  const approver = await prisma.user.findFirst({
    where: {
      role: "dean",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!approver) {
    throw new Error("Approver user not found");
  }

  const leave = await prisma.$transaction(async (tx) => {
    const createdLeave = await tx.leave.create({
      data: {
        userId,
        yearId: activeYear.id,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
        totalDays,
        reason: String(reason).trim(),
        isHalfDay: isHalfDayLeave,
        halfDayType: isHalfDayLeave ? normalizedHalfDayType : null,
        attachment: attachment || null,
        status: "pending_dean",
        deanApproved: false,
      },
    });

    await tx.notification.create({
      data: {
        userId: approver.id,
        title: "New Leave Request",
        message: "A staff member applied for leave",
        type: NOTIFICATION_TYPE.leaveApplied,
        leaveId: createdLeave.id,
      },
    });

    return createdLeave;
  });

  try {
    await sendLeaveApplicationSubmittedEmails({
      dean: {
        name: approver.name,
        email: approver.email,
      },
      applicant: {
        name: user.name,
        email: user.email,
      },
      leave,
    });
  } catch (error) {
    console.error(
      "[email] Leave application email dispatch failed:",
      error?.message || error,
    );
  }

  return leave;
}

export async function approveByDean(leaveId, user) {
  ensureActorRole(user, "dean");

  const deanProfile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const leave = await getLeaveWithApplicant(leaveId);

  ensureNotSelfAction(leave, user, "approve");
  ensureActionAllowedOnLeave(leave, "pending_dean", "dean approval");

  if (leave.user.role !== "staff") {
    throw new Error("Dean can only approve staff leave requests");
  }

  if (!leave.yearId || !leave.leaveYear) {
    throw new Error("Leave year not found for this request");
  }

  const updatedLeave = await prisma.$transaction(async (tx) => {
    const leaveBalance = await tx.leaveBalance.findUnique({
      where: {
        userId_yearId: {
          userId: leave.userId,
          yearId: leave.yearId,
        },
      },
      select: {
        id: true,
        remaining: true,
      },
    });

    if (!leaveBalance) {
      throw new Error("Leave balance not found for this year");
    }

    validateYearlyLimit(
      leaveBalance.remaining,
      leave.totalDays,
      leave.leaveYear.yearlyLimit,
    );

    const updatedLeave = await tx.leave.update({
      where: { id: leave.id },
      data: {
        deanApproved: true,
        deanId: user.id,
        status: "approved",
      },
    });

    await tx.leaveBalance.update({
      where: { id: leaveBalance.id },
      data: {
        used: {
          increment: leave.totalDays,
        },
        remaining: {
          decrement: leave.totalDays,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: leave.userId,
        title: "Leave Approved",
        message: "Your leave has been approved",
        type: NOTIFICATION_TYPE.leaveApproved,
        leaveId: leave.id,
      },
    });

    return updatedLeave;
  });

  try {
    await sendLeaveApprovedEmail({
      dean: {
        name: deanProfile?.name || "Dean",
        email: deanProfile?.email || "",
      },
      applicant: {
        name: leave.user.name,
        email: leave.user.email,
      },
      leave: {
        ...leave,
        ...updatedLeave,
        status: "approved",
      },
    });
  } catch (error) {
    console.error(
      "[email] Leave approval email dispatch failed:",
      error?.message || error,
    );
  }

  return updatedLeave;
}

export async function rejectByDean(leaveId, reason, user) {
  ensureActorRole(user, "dean");

  const deanProfile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const rejectionReason = String(reason || "").trim();

  if (!rejectionReason) {
    throw new Error("Rejection reason is required");
  }

  const leave = await getLeaveWithApplicant(leaveId);

  ensureNotSelfAction(leave, user, "reject");
  ensureActionAllowedOnLeave(leave, "pending_dean", "dean review");

  if (leave.user.role !== "staff") {
    throw new Error("Dean can only reject staff leave requests");
  }

  const updatedLeave = await prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leave.update({
      where: { id: leave.id },
      data: {
        status: "rejected",
        rejectionReason,
        deanId: user.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: leave.userId,
        title: "Leave Rejected",
        message: "Your leave was rejected: " + rejectionReason,
        type: NOTIFICATION_TYPE.leaveRejected,
        leaveId: leave.id,
      },
    });

    return updatedLeave;
  });

  try {
    await sendLeaveRejectedEmail({
      dean: {
        name: deanProfile?.name || "Dean",
        email: deanProfile?.email || "",
      },
      applicant: {
        name: leave.user.name,
        email: leave.user.email,
      },
      leave: {
        ...leave,
        ...updatedLeave,
        status: "rejected",
      },
      remarks: rejectionReason,
    });
  } catch (error) {
    console.error(
      "[email] Leave rejection email dispatch failed:",
      error?.message || error,
    );
  }

  return updatedLeave;
}

export async function getMyLeaveHistory(userId) {
  return prisma.leave.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fromDate: true,
      toDate: true,
      isHalfDay: true,
      halfDayType: true,
      totalDays: true,
      reason: true,
      attachment: true,
      status: true,
      deanApproved: true,
      rejectionReason: true,
      createdAt: true,
    },
  });
}

export async function getMyLeaveBalance(userId) {
  const activeYear = await getActiveYear();
  const leaveBalance = await ensureLeaveBalanceForYear(userId, activeYear);

  return {
    yearId: activeYear.id,
    yearName: activeYear.name,
    startDate: activeYear.startDate,
    endDate: activeYear.endDate,
    monthlyLimit: activeYear.monthlyLimit,
    yearlyLimit: activeYear.yearlyLimit,
    total: leaveBalance.total,
    used: leaveBalance.used,
    remaining: leaveBalance.remaining,
  };
}

export async function getMonthlyLeaveSummary(userId) {
  const activeYear = await getActiveYear();
  const [yearStart, yearEnd] = [
    toDateOnly(activeYear.startDate),
    toDateOnly(activeYear.endDate),
  ];

  if (!yearStart || !yearEnd) {
    throw new Error("Active leave year is invalid");
  }

  const [leaves, holidays] = await Promise.all([
    prisma.leave.findMany({
      where: {
        userId,
        yearId: activeYear.id,
        status: {
          not: "rejected",
        },
      },
      select: {
        fromDate: true,
        toDate: true,
        isHalfDay: true,
      },
    }),
    prisma.holiday.findMany({
      select: {
        date: true,
      },
    }),
  ]);

  const monthlyTotals = new Map();
  const holidaySet = buildHolidayDateSet(holidays);

  for (const leave of leaves) {
    const leaveStart = toDateOnly(leave.fromDate);
    const leaveEnd = toDateOnly(leave.toDate);

    if (!leaveStart || !leaveEnd) {
      continue;
    }

    const effectiveStart = leaveStart > yearStart ? leaveStart : yearStart;
    const effectiveEnd = leaveEnd < yearEnd ? leaveEnd : yearEnd;

    if (effectiveStart > effectiveEnd) {
      continue;
    }

    const usageByMonth = calculateWorkingDaysByMonthWithHolidaySet(
      effectiveStart,
      effectiveEnd,
      holidaySet,
      leave.isHalfDay === true,
    );

    for (const [monthKey, days] of usageByMonth.entries()) {
      const currentTotal = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, currentTotal + days);
    }
  }

  const monthFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "UTC",
  });

  return [...monthlyTotals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, totalDays]) => {
      const [year, month] = monthKey.split("-").map(Number);

      return {
        monthKey,
        month: monthFormatter.format(new Date(Date.UTC(year, month - 1, 1))),
        used: Number(totalDays.toFixed(2)),
      };
    });
}

export async function getPendingLeavesForDean(user) {
  ensureActorRole(user, "dean");

  const activeYear = await getActiveYear();

  return prisma.leave.findMany({
    where: {
      yearId: activeYear.id,
      status: "pending_dean",
      user: {
        role: "staff",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      fromDate: true,
      toDate: true,
      isHalfDay: true,
      halfDayType: true,
      totalDays: true,
      reason: true,
      attachment: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
    },
  });
}

export async function getPendingLeaves(user) {
  return getPendingLeavesForDean(user);
}

export async function getDeanDashboardOverview(user) {
  ensureActorRole(user, "dean");

  const activeYear = await getActiveYear();
  const now = new Date();
  const { monthStart, monthEnd, nextMonthStart } = getUtcMonthRange(now);

  const [monthlyRequests, approvedLeaves, holidays] = await Promise.all([
    prisma.leave.findMany({
      where: {
        yearId: activeYear.id,
        createdAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        user: {
          role: "staff",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fromDate: true,
        toDate: true,
        totalDays: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            designation: true,
          },
        },
      },
    }),
    prisma.leave.findMany({
      where: {
        yearId: activeYear.id,
        status: "approved",
        fromDate: {
          lte: monthEnd,
        },
        toDate: {
          gte: monthStart,
        },
        user: {
          role: "staff",
        },
      },
      select: {
        fromDate: true,
        toDate: true,
        isHalfDay: true,
        user: {
          select: {
            id: true,
            name: true,
            designation: true,
          },
        },
      },
    }),
    prisma.holiday.findMany({
      select: {
        date: true,
      },
    }),
  ]);

  const metrics = {
    totalRequests: monthlyRequests.length,
    pendingRequests: monthlyRequests.filter(
      (leave) => leave.status === "pending_dean",
    ).length,
    approvedRequests: monthlyRequests.filter(
      (leave) => leave.status === "approved",
    ).length,
    rejectedRequests: monthlyRequests.filter(
      (leave) => leave.status === "rejected",
    ).length,
  };

  const recentActivity = monthlyRequests.slice(0, 10).map((leave) => ({
    id: leave.id,
    userName: leave.user.name,
    fromDate: leave.fromDate,
    toDate: leave.toDate,
    totalDays: leave.totalDays,
    status: leave.status,
    createdAt: leave.createdAt,
  }));

  const usageByUser = new Map();

  for (const leave of approvedLeaves) {
    const leaveFromDate = toDateOnly(leave.fromDate);
    const leaveToDate = toDateOnly(leave.toDate);

    if (!leaveFromDate || !leaveToDate) {
      continue;
    }

    const intersection = getDateIntersection(
      leaveFromDate,
      leaveToDate,
      monthStart,
      monthEnd,
    );

    if (!intersection) {
      continue;
    }

    const days = calculateWorkingDays(
      intersection.start,
      intersection.end,
      holidays,
      leave.isHalfDay === true,
    );

    if (days <= 0) {
      continue;
    }

    const existing = usageByUser.get(leave.user.id) || {
      userId: leave.user.id,
      name: leave.user.name,
      designation: leave.user.designation,
      totalDays: 0,
      requestCount: 0,
    };

    existing.totalDays += days;
    existing.requestCount += 1;
    usageByUser.set(leave.user.id, existing);
  }

  const topUsers = [...usageByUser.values()]
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 5)
    .map((entry) => ({
      ...entry,
      totalDays: Number(entry.totalDays.toFixed(2)),
    }));

  return {
    month: formatMonthLabel(now),
    metrics,
    recentActivity,
    topUsers,
  };
}

export async function getLeaveUserDetailsForDean(userId, actor) {
  ensureActorRole(actor, "dean");

  const activeYear = await getActiveYear();
  const now = new Date();
  const { monthStart, monthEnd } = getUtcMonthRangeFromDate(now);

  const [targetUser, leaveBalance, monthlyLeaves, lastLeaves, holidays] =
    await prisma.$transaction([
      prisma.user.findFirst({
        where: {
          id: userId,
          role: "staff",
        },
        select: {
          id: true,
          name: true,
          designation: true,
        },
      }),
      prisma.leaveBalance.findUnique({
        where: {
          userId_yearId: {
            userId,
            yearId: activeYear.id,
          },
        },
        select: {
          total: true,
          used: true,
          remaining: true,
        },
      }),
      prisma.leave.findMany({
        where: {
          userId,
          yearId: activeYear.id,
          fromDate: {
            lte: monthEnd,
          },
          toDate: {
            gte: monthStart,
          },
          status: {
            not: "rejected",
          },
        },
        select: {
          id: true,
          fromDate: true,
          toDate: true,
          isHalfDay: true,
          status: true,
        },
      }),
      prisma.leave.findMany({
        where: {
          userId,
          yearId: activeYear.id,
        },
        orderBy: {
          fromDate: "desc",
        },
        take: 5,
        select: {
          id: true,
          fromDate: true,
          toDate: true,
          totalDays: true,
          status: true,
        },
      }),
      prisma.holiday.findMany({
        select: {
          date: true,
        },
      }),
    ]);

  if (!targetUser) {
    throw new Error("User not found");
  }

  let monthlyTotal = 0;
  let monthlyApproved = 0;
  let monthlyPending = 0;
  let monthlyRequestCount = 0;

  for (const leave of monthlyLeaves) {
    const leaveStart = toDateOnly(leave.fromDate);
    const leaveEnd = toDateOnly(leave.toDate);

    if (!leaveStart || !leaveEnd) {
      continue;
    }

    const intersection = getDateIntersection(
      leaveStart,
      leaveEnd,
      monthStart,
      monthEnd,
    );

    if (!intersection) {
      continue;
    }

    const days = calculateWorkingDays(
      intersection.start,
      intersection.end,
      holidays,
      leave.isHalfDay === true,
    );

    if (days <= 0) {
      continue;
    }

    monthlyTotal += days;
    monthlyRequestCount += 1;

    if (leave.status === "approved") {
      monthlyApproved += days;
    }

    if (leave.status === "pending_dean") {
      monthlyPending += days;
    }
  }

  return {
    user: {
      name: targetUser.name,
      designation: targetUser.designation,
    },
    leaveBalance: leaveBalance || {
      total: activeYear.yearlyLimit,
      used: 0,
      remaining: activeYear.yearlyLimit,
    },
    monthlyUsage: {
      month: formatMonthLabel(now),
      totalDays: Number(monthlyTotal.toFixed(2)),
      approvedDays: Number(monthlyApproved.toFixed(2)),
      pendingDays: Number(monthlyPending.toFixed(2)),
      requestCount: monthlyRequestCount,
    },
    activeYear: {
      id: activeYear.id,
      name: activeYear.name,
      startDate: activeYear.startDate,
      endDate: activeYear.endDate,
      monthlyLimit: activeYear.monthlyLimit,
      yearlyLimit: activeYear.yearlyLimit,
    },
    lastLeaves,
    previousLeaves: lastLeaves,
  };
}

export async function getAllLeavesForAdmin(user) {
  ensureActorRole(user, "admin");

  return prisma.leave.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fromDate: true,
      toDate: true,
      isHalfDay: true,
      halfDayType: true,
      totalDays: true,
      status: true,
      reason: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          designation: true,
        },
      },
    },
  });
}
