import {
  activateLeaveYear as activateLeaveYearService,
  createLeaveYear as createLeaveYearService,
  getActiveYearOrNull as getActiveYearOrNullService,
  listLeaveYears as listLeaveYearsService,
} from "../services/year.service.js";
import { getRequestContext } from "../utils/auditLogger.js";
import { sendSafeErrorResponse } from "../utils/errorResponder.js";

function parseYearId(rawId) {
  const parsedYearId = Number(rawId);

  if (!Number.isInteger(parsedYearId) || parsedYearId <= 0) {
    throw new Error("Invalid year id");
  }

  return parsedYearId;
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

export async function getLeaveYears(req, res) {
  try {
    const years = await listLeaveYearsService(req.user);
    return res.status(200).json({ years });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch leave years",
      "year.fetch.error",
    );
  }
}

export async function getActiveLeaveYear(req, res) {
  try {
    const activeYear = await getActiveYearOrNullService();
    return res.status(200).json({ activeYear });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to fetch active leave year",
      "year.active.error",
    );
  }
}

export async function createLeaveYear(req, res) {
  try {
    const year = await createLeaveYearService(req.user, req.body);
    return res.status(201).json({
      message: "Leave year created",
      year,
    });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to create leave year",
      "year.create.error",
    );
  }
}

export async function activateLeaveYear(req, res) {
  try {
    const yearId = parseYearId(req.params.id);
    const year = await activateLeaveYearService(req.user, yearId);

    return res.status(200).json({
      message: "Leave year activated",
      year,
    });
  } catch (error) {
    return handleError(
      req,
      res,
      error,
      "Failed to activate leave year",
      "year.activate.error",
    );
  }
}
