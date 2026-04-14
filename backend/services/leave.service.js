import prisma from "../config/prisma.js";
import { calculateLeaveDays, toDateOnly } from "../utils/leaveCalculator.js";

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
        type: "leave_applied",
        leaveId: createdLeave.id,
      },
    });

    return createdLeave;
  });

  return leave;
}

export async function approveLeave(leaveId, approverId) {
  const approver = await prisma.user.findUnique({
    where: { id: approverId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!approver) {
    throw new Error("User not found");
  }

  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!leave) {
    throw new Error("Leave not found");
  }

  if (approver.id === leave.userId) {
    throw new Error("You cannot approve your own leave");
  }

  if (leave.user.role === "dean" && approver.role !== "hod") {
    throw new Error("Only HOD can approve this leave");
  }

  if (leave.status === "pending_dean") {
    if (approver.role !== "dean") {
      throw new Error("Only dean can approve this leave");
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
          status: "pending_hod",
          deanApproved: true,
          deanId: approver.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: hod.id,
          title: "Leave Needs HOD Approval",
          message: "Dean approved a leave request",
          type: "dean_approved",
          leaveId: leave.id,
        },
      });

      return updatedLeave;
    });
  }

  if (leave.status === "pending_hod") {
    if (approver.role !== "hod") {
      throw new Error("Only HOD can approve this leave");
    }

    return prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leave.update({
        where: { id: leave.id },
        data: {
          status: "approved",
          hodApproved: true,
          hodId: approver.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: leave.userId,
          title: "Leave Request Approved",
          message: "Your leave request has been approved",
          type: "final_decision",
          leaveId: leave.id,
        },
      });

      return updatedLeave;
    });
  }

  throw new Error("Leave is not pending approval");
}
