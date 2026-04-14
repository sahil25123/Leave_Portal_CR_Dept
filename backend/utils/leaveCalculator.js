function toDateOnly(input) {
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

export function calculateLeaveDays(
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

  const holidaySet = new Set(
    holidays
      .map((holiday) => {
        const dateValue = holiday?.date ?? holiday;
        const holidayDate = toDateOnly(dateValue);
        return holidayDate ? toDateKey(holidayDate) : null;
      })
      .filter(Boolean),
  );

  let totalWorkingDays = 0;

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const isSunday = cursor.getUTCDay() === 0;
    const isHoliday = holidaySet.has(toDateKey(cursor));

    if (!isSunday && !isHoliday) {
      totalWorkingDays += 1;
    }
  }

  if (isHalfDay) {
    return totalWorkingDays > 0 ? 0.5 : 0;
  }

  return totalWorkingDays;
}

export { toDateOnly };
