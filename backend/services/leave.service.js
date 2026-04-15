import prisma from "../config/prisma.js";
import prismaPkg from "@prisma/client";
import { calculateLeaveDays, toDateOnly } from "../utils/leaveCalculator.js";

const { NotificationType } = prismaPkg;

const NOTIFICATION_TYPE = {
  leaveApplied: NotificationType?.leave_applied || "leave_applied",
  leaveApproved: NotificationType?.leave_approved || "final_decision",
  leaveRejected: NotificationType?.leave_rejected || "final_decision",
};

const APPLY_FLOW_BY_ROLE = {
  staff: {
    status: "pending_dean",
    approverRole: "dean",
    applyMessage: "A staff member applied for leave",
  },
  dean: {
    status: "pending_hod",
    approverRole: "hod",
    applyMessage: "Dean applied for leave",
  },
};

function parseAndValidateDates(fromDate, toDate) {
  const parsedFromDate = toDateOnly(fromDate);
  const parsedToDate = toDateOnly(toDate);

  if (!parsedFromDate || !parsedToDate || parsedFromDate > parsedToDate) {
    throw new Error("Invalid date range");
  }

  return { parsedFromDate, parsedToDate };
}

function getApplyFlow(role) {
  const flow = APPLY_FLOW_BY_ROLE[role];

  if (!flow) {
    throw new Error("Only staff and dean can apply for leave");
  }

  return flow;
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
  const { fromDate, toDate, reason, isHalfDay = false, attachment } = data;

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

  const flow = getApplyFlow(user.role);

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

  const approver = await prisma.user.findFirst({
    where: {
      role: flow.approverRole,
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
        attachment: attachment || null,
        status: flow.status,
        deanApproved: user.role === "dean",
        hodApproved: false,
      },
    });

    await tx.notification.create({
      data: {
        userId: approver.id,
        title: "New Leave Request",
        message: flow.applyMessage,
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

  const hod = await prisma.user.findFirst({
    where: { role: "hod" },
    select: { id: true },
  });

  if (!hod) {
    throw new Error("HOD user not found");
  }

  return prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leave.update({
      where: { id: leave.id },
      data: {
        deanApproved: true,
        deanId: user.id,
        status: "pending_hod",
      },
    });

    await tx.notification.create({
      data: {
        userId: hod.id,
        title: "Leave Pending Approval",
        message: "A leave request is waiting for your approval",
        type: NOTIFICATION_TYPE.leaveApplied,
        leaveId: leave.id,
      },
    });

    return updatedLeave;
  });
}

export async function approveByHod(leaveId, user) {
  ensureActorRole(user, "hod");

  const leave = await getLeaveWithApplicant(leaveId);

  ensureNotSelfAction(leave, user, "approve");
  ensureActionAllowedOnLeave(leave, "pending_hod", "HOD approval");

  if (leave.user.role === "dean" && user.role !== "hod") {
    throw new Error("Only HOD can approve this leave");
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
        used: true,
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
        hodApproved: true,
        hodId: user.id,
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

export async function rejectByHod(leaveId, reason, user) {
  ensureActorRole(user, "hod");

  const rejectionReason = String(reason || "").trim();

  if (!rejectionReason) {
    throw new Error("Rejection reason is required");
  }

  const leave = await getLeaveWithApplicant(leaveId);

  ensureNotSelfAction(leave, user, "reject");
  ensureActionAllowedOnLeave(leave, "pending_hod", "HOD review");

  return prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leave.update({
      where: { id: leave.id },
      data: {
        status: "rejected",
        rejectionReason,
        hodId: user.id,
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
