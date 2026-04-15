import {
  createHoliday as createHolidayService,
  deleteHolidayById,
  getAllHolidays,
  syncHolidays,
  updateHolidayById,
} from "../services/holiday.service.js";

function parseId(rawId, label) {
  const parsedId = Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return parsedId;
}

function getStatusCode(message) {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.includes("not found") || message.endsWith("not found")) {
    return 404;
  }

  return 400;
}

function handleError(res, error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  return res.status(getStatusCode(message)).json({ message });
}

export async function getHolidays(req, res) {
  try {
    const holidays = await getAllHolidays();
    return res.status(200).json({ holidays });
  } catch (error) {
    return handleError(res, error, "Failed to fetch holidays");
  }
}

export async function syncHolidayCalendar(req, res) {
  try {
    const { year } = req.body || {};
    const result = await syncHolidays(year);

    return res.status(200).json({
      message: "Holidays synced successfully",
      ...result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to sync holidays");
  }
}

export async function createHoliday(req, res) {
  try {
    const holiday = await createHolidayService(req.body);
    return res.status(201).json({
      message: "Holiday saved",
      holiday,
    });
  } catch (error) {
    return handleError(res, error, "Failed to create holiday");
  }
}

export async function updateHoliday(req, res) {
  try {
    const holidayId = parseId(req.params.id, "holiday");
    const holiday = await updateHolidayById(holidayId, req.body);

    return res.status(200).json({
      message: "Holiday updated",
      holiday,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update holiday");
  }
}

export async function deleteHoliday(req, res) {
  try {
    const holidayId = parseId(req.params.id, "holiday");
    await deleteHolidayById(holidayId);

    return res.status(200).json({
      message: "Holiday deleted",
    });
  } catch (error) {
    return handleError(res, error, "Failed to delete holiday");
  }
}
