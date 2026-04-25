const DEFAULT_YEARLY_LIMIT = 30;
const EPSILON = 1e-9;

function formatLimitValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return String(Number(numericValue.toFixed(2)));
}

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

export function validateYearlyLimit(
  remainingBalance,
  requestedDays,
  yearlyLimit = DEFAULT_YEARLY_LIMIT,
) {
  const remaining = Number(remainingBalance);
  const requested = Number(requestedDays);
  const limit = Number(yearlyLimit);

  if (
    !Number.isFinite(remaining) ||
    !Number.isFinite(requested) ||
    !Number.isFinite(limit) ||
    requested > limit + EPSILON ||
    requested > remaining + EPSILON
  ) {
    throw new Error(
      "Yearly limit exceeded (" + formatLimitValue(limit) + " days)",
    );
  }
}
