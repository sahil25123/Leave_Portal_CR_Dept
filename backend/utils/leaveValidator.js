const MONTHLY_LIMIT = 2.5;
const YEARLY_LIMIT = 30;
const EPSILON = 1e-9;

export function toDateOnly(input) {
  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
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
    const rawDate = holiday?.date ?? holiday;
    const holidayDate = toDateOnly(rawDate);

    if (holidayDate) {
      holidaySet.add(toDateKey(holidayDate));
    }
  }

  return holidaySet;
}

function isNonWorkingDayWithSet(date, holidaySet) {
  return date.getUTCDay() === 0 || holidaySet.has(toDateKey(date));
}

function calculateWorkingDaysByMonth(fromDate, toDate, holidaySet, isHalfDay) {
  const usageByMonth = new Map();

  for (
    let cursor = new Date(fromDate);
    cursor <= toDate;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    if (isNonWorkingDayWithSet(cursor, holidaySet)) {
      continue;
    }

    const monthKey = toMonthKey(cursor);
    const current = usageByMonth.get(monthKey) || 0;
    usageByMonth.set(monthKey, current + 1);
  }

  if (!isHalfDay) {
    return usageByMonth;
  }

  const monthlyEntries = [...usageByMonth.entries()];

  if (monthlyEntries.length === 0) {
    return usageByMonth;
  }

  const [monthKey] = monthlyEntries[0];
  usageByMonth.set(monthKey, 0.5);

  return usageByMonth;
}

export function isNonWorkingDate(date, holidays = []) {
  const normalizedDate = toDateOnly(date);

  if (!normalizedDate) {
    return false;
  }

  return isNonWorkingDayWithSet(normalizedDate, buildHolidayDateSet(holidays));
}

export function calculateWorkingDays(
  fromDate,
  toDate,
  holidays = [],
  isHalfDay = false,
) {
  const start = toDateOnly(fromDate);
  const end = toDateOnly(toDate);

  if (!start || !end || start > end) {
    throw new Error("Invalid date range");
  }

  const holidaySet = buildHolidayDateSet(holidays);
  const daysByMonth = calculateWorkingDaysByMonth(
    start,
    end,
    holidaySet,
    isHalfDay,
  );

  let totalWorkingDays = 0;

  for (const days of daysByMonth.values()) {
    totalWorkingDays += days;
  }

  return totalWorkingDays;
}

export function checkOverlap({
  existingLeaves,
  newFromDate,
  newToDate,
  isHalfDay,
  halfDayType,
}) {
  for (const leave of existingLeaves || []) {
    const existingFromDate = toDateOnly(leave.fromDate);
    const existingToDate = toDateOnly(leave.toDate);

    if (!existingFromDate || !existingToDate) {
      continue;
    }

    const hasOverlap =
      existingFromDate <= newToDate && existingToDate >= newFromDate;

    if (!hasOverlap) {
      continue;
    }

    const existingIsHalfDay = leave.isHalfDay === true;
    const existingHalfDayType = leave.halfDayType || null;
    const isSingleDayOverlap =
      existingFromDate.getTime() === existingToDate.getTime() &&
      newFromDate.getTime() === newToDate.getTime() &&
      existingFromDate.getTime() === newFromDate.getTime();

    if (isHalfDay && existingIsHalfDay && isSingleDayOverlap) {
      if (
        existingHalfDayType &&
        halfDayType &&
        existingHalfDayType !== halfDayType
      ) {
        continue;
      }
    }

    throw new Error("Leave overlaps with existing leave");
  }
}

export function validateMonthlyLimit({
  existingLeaves,
  newFromDate,
  newToDate,
  holidays,
  isHalfDay,
}) {
  const holidaySet = buildHolidayDateSet(holidays);
  const existingUsageByMonth = new Map();

  for (const leave of existingLeaves || []) {
    const fromDate = toDateOnly(leave.fromDate);
    const toDate = toDateOnly(leave.toDate);

    if (!fromDate || !toDate) {
      continue;
    }

    const leaveUsageByMonth = calculateWorkingDaysByMonth(
      fromDate,
      toDate,
      holidaySet,
      leave.isHalfDay === true,
    );

    for (const [monthKey, leaveDays] of leaveUsageByMonth.entries()) {
      const currentDays = existingUsageByMonth.get(monthKey) || 0;
      existingUsageByMonth.set(monthKey, currentDays + leaveDays);
    }
  }

  const requestedUsageByMonth = calculateWorkingDaysByMonth(
    newFromDate,
    newToDate,
    holidaySet,
    isHalfDay,
  );

  for (const [monthKey, requestedDays] of requestedUsageByMonth.entries()) {
    const currentDays = existingUsageByMonth.get(monthKey) || 0;

    if (currentDays + requestedDays > MONTHLY_LIMIT + EPSILON) {
      throw new Error("Monthly limit exceeded (2.5 days)");
    }
  }
}

export function validateYearlyLimit(remainingBalance, requestedDays) {
  const remaining = Number(remainingBalance);
  const requested = Number(requestedDays);

  if (
    !Number.isFinite(remaining) ||
    !Number.isFinite(requested) ||
    requested > YEARLY_LIMIT + EPSILON ||
    requested > remaining + EPSILON
  ) {
    throw new Error("Yearly limit exceeded (30 days)");
  }
}
