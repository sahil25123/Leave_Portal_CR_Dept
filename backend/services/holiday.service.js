import axios from "axios";
import prisma from "../config/prisma.js";

const CALENDARIFIC_URL = "https://calendarific.com/api/v2/holidays";
const COUNTRY_CODE = "IN";

function normalizeDate(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function parseCalendarificDate(rawHoliday) {
  if (rawHoliday?.date?.iso) {
    return normalizeDate(rawHoliday.date.iso);
  }

  const dateParts = rawHoliday?.date?.datetime;

  if (
    dateParts &&
    Number.isInteger(dateParts.year) &&
    Number.isInteger(dateParts.month) &&
    Number.isInteger(dateParts.day)
  ) {
    return new Date(
      Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day),
    );
  }

  return null;
}

function parseYear(year) {
  const parsedYear = Number(year ?? new Date().getUTCFullYear());

  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
    throw new Error("Invalid year");
  }

  return parsedYear;
}

function extractHolidayRows(apiPayload) {
  const rawRows = apiPayload?.response?.holidays;

  if (!Array.isArray(rawRows)) {
    throw new Error("Invalid holiday data from Calendarific");
  }

  const rows = [];

  for (const rawHoliday of rawRows) {
    const name = String(rawHoliday?.name || "").trim();
    const date = parseCalendarificDate(rawHoliday);

    if (!name || !date) {
      continue;
    }

    rows.push({ name, date });
  }

  return rows;
}

export async function syncHolidays(year) {
  const targetYear = parseYear(year);
  const apiKey = process.env.CALENDARIFIC_API_KEY;

  if (!apiKey) {
    throw new Error("CALENDARIFIC_API_KEY is not configured");
  }

  let responseData;

  try {
    const response = await axios.get(CALENDARIFIC_URL, {
      params: {
        api_key: apiKey,
        country: COUNTRY_CODE,
        year: targetYear,
      },
      timeout: 15000,
    });

    responseData = response.data;
  } catch (error) {
    const apiMessage =
      error?.response?.data?.meta?.error_detail ||
      error?.response?.data?.meta?.error_message;

    throw new Error(apiMessage || "Failed to sync holidays from Calendarific");
  }

  const holidayRows = extractHolidayRows(responseData);

  let syncedCount = 0;

  for (const row of holidayRows) {
    await prisma.holiday.upsert({
      where: { date: row.date },
      update: { name: row.name },
      create: {
        name: row.name,
        date: row.date,
      },
    });

    syncedCount += 1;
  }

  return {
    year: targetYear,
    syncedCount,
  };
}

export async function getAllHolidays() {
  return prisma.holiday.findMany({
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      name: true,
      date: true,
      createdAt: true,
    },
  });
}

export async function createHoliday(payload) {
  const name = String(payload?.name || "").trim();
  const date = normalizeDate(payload?.date);

  if (!name || !date) {
    throw new Error("name and date are required");
  }

  return prisma.holiday.upsert({
    where: {
      date,
    },
    update: {
      name,
    },
    create: {
      name,
      date,
    },
    select: {
      id: true,
      name: true,
      date: true,
      createdAt: true,
    },
  });
}

export async function deleteHolidayById(holidayId) {
  const existingHoliday = await prisma.holiday.findUnique({
    where: { id: holidayId },
    select: { id: true },
  });

  if (!existingHoliday) {
    throw new Error("Holiday not found");
  }

  await prisma.holiday.delete({
    where: {
      id: holidayId,
    },
  });

  return { success: true };
}
