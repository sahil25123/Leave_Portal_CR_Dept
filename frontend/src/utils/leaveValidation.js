export function toDateOnly(input) {
  const date = input instanceof Date ? new Date(input) : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function toDateKey(dateInput) {
  const date = toDateOnly(dateInput);

  if (!date) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function toMonthKey(dateInput) {
  const date = toDateOnly(dateInput);

  if (!date) {
    return "";
  }

  return (
    String(date.getUTCFullYear()) +
    "-" +
    String(date.getUTCMonth() + 1).padStart(2, "0")
  );
}

export function buildHolidayDateSet(holidays = []) {
  const holidaySet = new Set();

  for (const holiday of holidays) {
    const dateKey = toDateKey(holiday?.date ?? holiday);

    if (dateKey) {
      holidaySet.add(dateKey);
    }
  }

  return holidaySet;
}

export function isPastDate(dateInput) {
  const date = toDateOnly(dateInput);

  if (!date) {
    return false;
  }

  const today = toDateOnly(new Date());
  return date < today;
}

export function isNonWorkingDate(dateInput, holidayDateSet = new Set()) {
  const date = toDateOnly(dateInput);

  if (!date) {
    return false;
  }

  const isSunday = date.getUTCDay() === 0;
  const isHoliday = holidayDateSet.has(toDateKey(date));

  return isSunday || isHoliday;
}

function calculateWorkingDaysByMonth(
  fromDate,
  toDate,
  holidayDateSet,
  isHalfDay,
) {
  const usageByMonth = new Map();

  for (
    let cursor = new Date(fromDate);
    cursor <= toDate;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    if (isNonWorkingDate(cursor, holidayDateSet)) {
      continue;
    }

    const monthKey = toMonthKey(cursor);
    const currentUsage = usageByMonth.get(monthKey) || 0;
    usageByMonth.set(monthKey, currentUsage + 1);
  }

  if (!isHalfDay) {
    return usageByMonth;
  }

  const entries = [...usageByMonth.entries()];

  if (entries.length === 0) {
    return usageByMonth;
  }

  const [monthKey] = entries[0];
  usageByMonth.set(monthKey, 0.5);

  return usageByMonth;
}

export function calculateWorkingDays(
  fromDateInput,
  toDateInput,
  holidayDateSet,
  isHalfDay,
) {
  const fromDate = toDateOnly(fromDateInput);
  const toDate = toDateOnly(toDateInput);

  if (!fromDate || !toDate || fromDate > toDate) {
    return 0;
  }

  const usageByMonth = calculateWorkingDaysByMonth(
    fromDate,
    toDate,
    holidayDateSet,
    isHalfDay,
  );

  let total = 0;

  for (const value of usageByMonth.values()) {
    total += value;
  }

  return total;
}

function leavesWithoutRejected(leaves = []) {
  return leaves.filter((leave) => leave.status !== "rejected");
}

export function checkOverlapWarning({
  leaves,
  fromDate,
  toDate,
  isHalfDay,
  halfDayType,
}) {
  if (!fromDate || !toDate) {
    return "";
  }

  for (const leave of leavesWithoutRejected(leaves)) {
    const existingFromDate = toDateOnly(leave.fromDate);
    const existingToDate = toDateOnly(leave.toDate);

    if (!existingFromDate || !existingToDate) {
      continue;
    }

    const hasOverlap = existingFromDate <= toDate && existingToDate >= fromDate;

    if (!hasOverlap) {
      continue;
    }

    const existingIsHalfDay = leave.isHalfDay === true;
    const existingHalfDayType = leave.halfDayType || "";
    const isSingleDayOverlap =
      existingFromDate.getTime() === existingToDate.getTime() &&
      fromDate.getTime() === toDate.getTime() &&
      existingFromDate.getTime() === fromDate.getTime();

    if (isHalfDay && existingIsHalfDay && isSingleDayOverlap) {
      if (
        existingHalfDayType &&
        halfDayType &&
        existingHalfDayType !== halfDayType
      ) {
        continue;
      }
    }

    return "Leave overlaps with existing leave";
  }

  return "";
}
