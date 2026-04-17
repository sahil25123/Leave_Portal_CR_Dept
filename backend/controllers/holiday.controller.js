import {
  createHoliday as createHolidayService,
  deleteHolidayById,
  getAllHolidays,
  syncHolidays,
  updateHolidayById,
} from "../services/holiday.service.js";
import { getRequestContext } from "../utils/auditLogger.js";
import { sendSafeErrorResponse } from "../utils/errorResponder.js";

function parseId(rawId, label) {
  const parsedId = Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Invalid " + label + " id");
  }

  return parsedId;
}

function handleError(req, res, error, fallbackMessage, logEvent) {
  return sendSafeErrorResponse(res, error, {
    fallbackMessage,
    logEvent,
    logMeta: {
      ...getRequestContext(req),
      userId: req.user?.id,
      role: req.user?.role,
    },
  });
}

export async function getHolidays(req, res) {
  try {
    const holidays = await getAllHolidays();
    return res.status(200).json({ holidays });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch holidays",
      "holiday.fetch.error",
    );
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
    return handleError(
      req,
      res,
      error,
      "Failed to sync holidays",
      "holiday.sync.error",
    );
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
    return handleError(
      req,
      res,
      error,
      "Failed to create holiday",
      "holiday.create.error",
    );
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
    return handleError(
      req,
      res,
      error,
      "Failed to update holiday",
      "holiday.update.error",
    );
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
    return handleError(
      req,
      res,
      error,
      "Failed to delete holiday",
      "holiday.delete.error",
    );
  }
}
