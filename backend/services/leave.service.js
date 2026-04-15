import prisma from "../config/prisma.js";
import prismaPkg from "@prisma/client";
import {
  calculateWorkingDays,
  checkOverlap,
  isNonWorkingDate,
  toDateOnly,
  validateMonthlyLimit,
  validateYearlyLimit,
} from "../utils/leaveValidator.js";

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
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "staff") {
    throw new Error("Only staff can apply for leave");
  }

  const { parsedFromDate, parsedToDate } = parseAndValidateDates(
    fromDate,
    toDate,
  );
  const isHalfDayLeave = isHalfDay === true;
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

  const monthWindowStart = new Date(
    Date.UTC(parsedFromDate.getUTCFullYear(), parsedFromDate.getUTCMonth(), 1),
  );
  const monthWindowEnd = new Date(
    Date.UTC(parsedToDate.getUTCFullYear(), parsedToDate.getUTCMonth() + 1, 0),
  );

  const monthlyLeaves = await prisma.leave.findMany({
    where: {
      userId,
      status: {
        not: "rejected",
      },
      fromDate: {
        lte: monthWindowEnd,
      },
      toDate: {
        gte: monthWindowStart,
      },
    },
    select: {
      id: true,
      fromDate: true,
      toDate: true,
      isHalfDay: true,
      halfDayType: true,
    },
  });

  validateMonthlyLimit({
    existingLeaves: monthlyLeaves,
    newFromDate: parsedFromDate,
    newToDate: parsedToDate,
    holidays,
    isHalfDay: isHalfDayLeave,
  });

  const leaveYear = parsedFromDate.getUTCFullYear();
  const leaveBalance = await prisma.leaveBalance.upsert({
    where: {
      userId_year: {
        userId,
        year: leaveYear,
      },
    },
    update: {},
    create: {
      userId,
      year: leaveYear,
      total: 30,
      used: 0,
      remaining: 30,
    },
    select: {
      remaining: true,
    },
  });

  validateYearlyLimit(leaveBalance.remaining, totalDays);

  const approver = await prisma.user.findFirst({
    where: {
      role: "dean",
    },
    select: {
      id: true,
    },
  });

  if (!approver) {
    throw new Error("Approver user not found");
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

  return leave;
}

export async function approveByDean(leaveId, user) {
  ensureActorRole(user, "dean");

  const leave = await getLeaveWithApplicant(leaveId);

  ensureNotSelfAction(leave, user, "approve");
  ensureActionAllowedOnLeave(leave, "pending_dean", "dean approval");

  if (leave.user.role !== "staff") {
    throw new Error("Dean can only approve staff leave requests");
  }

  const leaveYear = leave.fromDate.getUTCFullYear();

  return prisma.$transaction(async (tx) => {
    const leaveBalance = await tx.leaveBalance.findUnique({
      where: {
        userId_year: {
          userId: leave.userId,
          year: leaveYear,
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

    if (leaveBalance.remaining < leave.totalDays) {
      throw new Error("Insufficient leave balance");
    }

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
}

export async function rejectByDean(leaveId, reason, user) {
  ensureActorRole(user, "dean");

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

  return prisma.$transaction(async (tx) => {
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
  const year = new Date().getUTCFullYear();

  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
    select: {
      year: true,
      total: true,
      used: true,
      remaining: true,
    },
  });

  if (leaveBalance) {
    return leaveBalance;
  }

  return prisma.leaveBalance.create({
    data: {
      userId,
      year,
      total: 30,
      used: 0,
      remaining: 30,
    },
    select: {
      year: true,
      total: true,
      used: true,
      remaining: true,
    },
  });
}

export async function getPendingLeavesForDean(user) {
  ensureActorRole(user, "dean");

  return prisma.leave.findMany({
    where: {
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

  const now = new Date();
  const { monthStart, monthEnd, nextMonthStart } = getUtcMonthRange(now);

  const [monthlyRequests, approvedLeaves, holidays] = await Promise.all([
    prisma.leave.findMany({
      where: {
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

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      role: true,
      createdAt: true,
    },
  });

  if (!targetUser || targetUser.role !== "staff") {
    throw new Error("User not found");
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const { monthStart, monthEnd } = getUtcMonthRange(now);

  const [leaveBalance, monthlyLeaves, previousLeaves, holidays] =
    await Promise.all([
      prisma.leaveBalance.findUnique({
        where: {
          userId_year: {
            userId,
            year,
          },
        },
        select: {
          year: true,
          total: true,
          used: true,
          remaining: true,
        },
      }),
      prisma.leave.findMany({
        where: {
          userId,
          status: {
            not: "rejected",
          },
          fromDate: {
            lte: monthEnd,
          },
          toDate: {
            gte: monthStart,
          },
        },
        select: {
          fromDate: true,
          toDate: true,
          isHalfDay: true,
          status: true,
        },
      }),
      prisma.leave.findMany({
        where: { userId },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          fromDate: true,
          toDate: true,
          totalDays: true,
          status: true,
          reason: true,
          isHalfDay: true,
          halfDayType: true,
          createdAt: true,
        },
      }),
      prisma.holiday.findMany({
        select: {
          date: true,
        },
      }),
    ]);

  let monthlyTotal = 0;
  let monthlyApproved = 0;
  let monthlyPending = 0;

  for (const leave of monthlyLeaves) {
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

    monthlyTotal += days;

    if (leave.status === "approved") {
      monthlyApproved += days;
    }

    if (leave.status === "pending_dean") {
      monthlyPending += days;
    }
  }

  return {
    user: targetUser,
    leaveBalance: leaveBalance || {
      year,
      total: 30,
      used: 0,
      remaining: 30,
    },
    monthlyUsage: {
      month: formatMonthLabel(now),
      totalDays: Number(monthlyTotal.toFixed(2)),
      approvedDays: Number(monthlyApproved.toFixed(2)),
      pendingDays: Number(monthlyPending.toFixed(2)),
      requestCount: monthlyLeaves.length,
    },
    previousLeaves,
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
