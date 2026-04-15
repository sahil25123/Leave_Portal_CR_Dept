import {
  activateLeaveYear as activateLeaveYearService,
  createLeaveYear as createLeaveYearService,
  getActiveYearOrNull as getActiveYearOrNullService,
  listLeaveYears as listLeaveYearsService,
} from "../services/year.service.js";

function parseYearId(rawId) {
  const parsedYearId = Number(rawId);

  if (!Number.isInteger(parsedYearId) || parsedYearId <= 0) {
    throw new Error("Invalid year id");
  }

  return parsedYearId;
}

function getStatusCode(message) {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.endsWith("not found") || message.includes("not found")) {
    return 404;
  }

  return 400;
}

function handleError(res, error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  return res.status(getStatusCode(message)).json({ message });
}

export async function getLeaveYears(req, res) {
  try {
    const years = await listLeaveYearsService(req.user);
    return res.status(200).json({ years });
  } catch (error) {
    return handleError(res, error, "Failed to fetch leave years");
  }
}

export async function getActiveLeaveYear(req, res) {
  try {
    const activeYear = await getActiveYearOrNullService();
    return res.status(200).json({ activeYear });
  } catch (error) {
    return handleError(res, error, "Failed to fetch active leave year");
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
    return handleError(res, error, "Failed to create leave year");
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
    return handleError(res, error, "Failed to activate leave year");
  }
}
