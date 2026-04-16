import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import "react-datepicker/dist/react-datepicker.css";
import { getApiErrorMessage } from "../services/api";
import {
  applyLeaveRequest,
  getLeaveHolidaysRequest,
  getMonthlyLeaveSummaryRequest,
  getMyLeaveBalanceRequest,
  getMyLeaveHistoryRequest,
} from "../services/leave.service";
import {
  calculateWorkingDays,
  checkMonthlyLimitWarning,
  checkOverlapWarning,
  isNonWorkingDate,
  isPastDate,
  toDateKey,
  toDateOnly,
} from "../utils/leaveValidation";

const ALLOWED_FILE_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

function toLocalStartOfDay(input) {
  if (!input) {
    return null;
  }

  const date = input instanceof Date ? new Date(input) : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDateKey(input) {
  const date = toLocalStartOfDay(input);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function parseLocalDateKey(value) {
  const parts = String(value || "").split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getFileExtension(fileName) {
  const parts = String(fileName || "").split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1].toLowerCase();
}

const INITIAL_FORM = {
  fromDate: "",
  toDate: "",
  reason: "",
  isHalfDay: false,
  halfDayType: "",
  attachment: null,
};

function LeaveApply() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [holidays, setHolidays] = useState([]);
  const [history, setHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayDate = useMemo(() => toLocalStartOfDay(new Date()), []);
  const holidayDates = useMemo(() => {
    return holidays
      .map((holiday) => toLocalStartOfDay(holiday?.date))
      .filter(Boolean);
  }, [holidays]);
  const holidayDateSet = useMemo(() => {
    const set = new Set();

    for (const holiday of holidays) {
      const dateKey = toDateKey(holiday?.date);

      if (dateKey) {
        set.add(dateKey);
      }
    }

    return set;
  }, [holidays]);
  const pickerHolidayDateSet = useMemo(() => {
    return new Set(holidayDates.map((holidayDate) => toLocalDateKey(holidayDate)));
  }, [holidayDates]);
  const holidayNameByDate = useMemo(() => {
    const map = new Map();

    for (const holiday of holidays) {
      const dateKey = toDateKey(holiday?.date);
      const localDateKey = toLocalDateKey(holiday?.date);
      const holidayName = holiday?.name || "Holiday";

      if (dateKey) {
        map.set(dateKey, holidayName);
      }

      if (localDateKey) {
        map.set(localDateKey, holidayName);
      }
    }

    return map;
  }, [holidays]);

  const fromDate = useMemo(() => toDateOnly(form.fromDate), [form.fromDate]);
  const toDate = useMemo(() => toDateOnly(form.toDate), [form.toDate]);
  const activeYearStart = useMemo(
    () => toDateOnly(balance?.startDate),
    [balance?.startDate],
  );
  const activeYearEnd = useMemo(
    () => toDateOnly(balance?.endDate),
    [balance?.endDate],
  );
  const activeYearStartLocal = useMemo(
    () => toLocalStartOfDay(activeYearStart),
    [activeYearStart],
  );
  const activeYearEndLocal = useMemo(
    () => toLocalStartOfDay(activeYearEnd),
    [activeYearEnd],
  );
  const fromDatePickerValue = useMemo(
    () => parseLocalDateKey(form.fromDate),
    [form.fromDate],
  );
  const toDatePickerValue = useMemo(
    () => parseLocalDateKey(form.toDate),
    [form.toDate],
  );
  const minSelectableDate = useMemo(() => {
    if (!todayDate) {
      return activeYearStartLocal;
    }

    if (!activeYearStartLocal) {
      return todayDate;
    }

    return activeYearStartLocal > todayDate ? activeYearStartLocal : todayDate;
  }, [activeYearStartLocal, todayDate]);
  const minToDate = useMemo(() => {
    if (!fromDatePickerValue) {
      return minSelectableDate;
    }

    if (!minSelectableDate) {
      return fromDatePickerValue;
    }

    return fromDatePickerValue > minSelectableDate
      ? fromDatePickerValue
      : minSelectableDate;
  }, [fromDatePickerValue, minSelectableDate]);
  const maxSelectableDate = useMemo(
    () => activeYearEndLocal || null,
    [activeYearEndLocal],
  );

  const filterSelectableDate = useCallback(
    (candidateDate) => {
      const normalizedDate = toLocalStartOfDay(candidateDate);

      if (!normalizedDate) {
        return false;
      }

      if (normalizedDate.getDay() === 0) {
        return false;
      }

      if (pickerHolidayDateSet.has(toLocalDateKey(normalizedDate))) {
        return false;
      }

      if (minSelectableDate && normalizedDate < minSelectableDate) {
        return false;
      }

      if (maxSelectableDate && normalizedDate > maxSelectableDate) {
        return false;
      }

      return true;
    },
    [maxSelectableDate, minSelectableDate, pickerHolidayDateSet],
  );

  const filterToDate = useCallback(
    (candidateDate) => {
      if (!filterSelectableDate(candidateDate)) {
        return false;
      }

      const normalizedDate = toDateOnly(candidateDate);

      if (!normalizedDate) {
        return false;
      }

      if (fromDatePickerValue && normalizedDate < fromDatePickerValue) {
        return false;
      }

      return true;
    },
    [filterSelectableDate, fromDatePickerValue],
  );
  const calculatedDays = useMemo(() => {
    return calculateWorkingDays(
      form.fromDate,
      form.toDate,
      holidayDateSet,
      form.isHalfDay,
    );
  }, [form.fromDate, form.toDate, form.isHalfDay, holidayDateSet]);

  const selectedMonthDate = useMemo(() => {
    return toDateOnly(form.fromDate) || toDateOnly(new Date());
  }, [form.fromDate]);

  const selectedMonthKey = useMemo(() => {
    if (!selectedMonthDate) {
      return "";
    }

    return (
      String(selectedMonthDate.getUTCFullYear()) +
      "-" +
      String(selectedMonthDate.getUTCMonth() + 1).padStart(2, "0")
    );
  }, [selectedMonthDate]);

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonthDate) {
      return "";
    }

    return selectedMonthDate.toLocaleString("en-IN", {
      month: "long",
      timeZone: "UTC",
    });
  }, [selectedMonthDate]);

  const selectedMonthUsage = useMemo(() => {
    return (
      monthlySummary.find(
        (entry) =>
          entry.monthKey === selectedMonthKey ||
          entry.month === selectedMonthLabel,
      ) || null
    );
  }, [monthlySummary, selectedMonthKey, selectedMonthLabel]);

  const monthlyLimit = Number(
    balance?.monthlyLimit || selectedMonthUsage?.limit || 2.5,
  );
  const currentMonthUsed = Number(selectedMonthUsage?.used || 0);
  const projectedMonthUsage = Number(
    (currentMonthUsed + (calculatedDays || 0)).toFixed(2),
  );
  const activeYearHistory = useMemo(() => {
    if (!balance?.yearId) {
      return history;
    }

    return history.filter(
      (leave) => Number(leave?.yearId) === Number(balance.yearId),
    );
  }, [balance?.yearId, history]);

  useEffect(() => {
    async function loadApplyLeaveContext() {
      setIsLoadingContext(true);
      setContextError("");

      try {
        const [holidayRows, historyRows, monthlySummaryRows, balanceData] =
          await Promise.all([
            getLeaveHolidaysRequest(),
            getMyLeaveHistoryRequest(),
            getMonthlyLeaveSummaryRequest(),
            getMyLeaveBalanceRequest(),
          ]);

        setHolidays(holidayRows);
        setHistory(historyRows);
        setMonthlySummary(monthlySummaryRows);
        setBalance(balanceData);
      } catch (loadError) {
        setContextError(
          getApiErrorMessage(loadError, "Failed to load leave validations"),
        );
      } finally {
        setIsLoadingContext(false);
      }
    }

    loadApplyLeaveContext();
  }, []);

  const validation = useMemo(() => {
    const errors = [];
    const warnings = [];

    if (!form.fromDate || !form.toDate) {
      return { errors, warnings };
    }

    if (!fromDate || !toDate || fromDate > toDate) {
      errors.push("Invalid date range");
      return { errors, warnings };
    }

    if (
      activeYearStart &&
      activeYearEnd &&
      (fromDate < activeYearStart || toDate > activeYearEnd)
    ) {
      errors.push("Leave must be within active year");
    }

    if (isPastDate(fromDate) || isPastDate(toDate)) {
      errors.push("Past dates cannot be selected");
    }

    if (
      isNonWorkingDate(fromDate, holidayDateSet) ||
      isNonWorkingDate(toDate, holidayDateSet)
    ) {
      errors.push("Cannot apply leave on holiday or Sunday");
    }

    if (form.isHalfDay && fromDate.getTime() !== toDate.getTime()) {
      errors.push("Half day only allowed for single day");
    }

    if (form.isHalfDay && !form.halfDayType) {
      errors.push("Select half day type");
    }

    if (calculatedDays === 0) {
      errors.push("Cannot apply leave on holiday or Sunday");
    }

    const overlapWarning = checkOverlapWarning({
      leaves: activeYearHistory,
      fromDate,
      toDate,
      isHalfDay: form.isHalfDay,
      halfDayType: form.halfDayType,
    });

    if (overlapWarning) {
      warnings.push(overlapWarning);
    }

    const monthlyWarning = checkMonthlyLimitWarning({
      leaves: activeYearHistory,
      fromDate,
      toDate,
      holidayDateSet,
      isHalfDay: form.isHalfDay,
      monthlyLimit,
    });

    if (monthlyWarning) {
      warnings.push(monthlyWarning);
    }

    return {
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
    };
  }, [
    activeYearEnd,
    activeYearStart,
    calculatedDays,
    form.fromDate,
    form.halfDayType,
    form.isHalfDay,
    form.toDate,
    fromDate,
    activeYearHistory,
    monthlyLimit,
    holidayDateSet,
    toDate,
  ]);

  const isInvalid =
    !form.fromDate ||
    !form.toDate ||
    !String(form.reason || "").trim() ||
    validation.errors.length > 0 ||
    validation.warnings.length > 0 ||
    Boolean(contextError);

  const selectedFileName = form.attachment?.name || "";

  function updateField(field, value) {
    setFieldError("");
    setError("");
    setSuccess("");

    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "isHalfDay") {
        next.halfDayType = value ? current.halfDayType || "first_half" : "";

        if (value && current.fromDate) {
          next.toDate = current.fromDate;
        }
      }

      if (field === "fromDate" && current.isHalfDay) {
        next.toDate = value;
      }

      return next;
    });
  }

  function handleDateChange(field, value) {
    const selectedDate = toLocalStartOfDay(value);

    if (!selectedDate) {
      updateField(field, "");
      return;
    }

    if (!filterSelectableDate(selectedDate)) {
      if (selectedDate.getDay() === 0) {
        setFieldError("Cannot apply leave on Sunday");
        return;
      }

      const holidayName = holidayNameByDate.get(toLocalDateKey(selectedDate));

      if (holidayName) {
        setFieldError(
          "Cannot select " + toLocalDateKey(selectedDate) + " (" + holidayName + ")",
        );
        return;
      }

      if (todayDate && selectedDate < todayDate) {
        setFieldError("Past dates cannot be selected");
        return;
      }

      if (
        activeYearStartLocal &&
        activeYearEndLocal &&
        (selectedDate < activeYearStartLocal || selectedDate > activeYearEndLocal)
      ) {
        setFieldError("Date must be within active year");
        return;
      }

      setFieldError("Date cannot be selected");
      return;
    }

    updateField(field, toLocalDateKey(selectedDate));
  }

  function handleAttachmentChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      updateField("attachment", null);
      return;
    }

    const extension = getFileExtension(file.name);

    if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
      setFieldError("Only PDF, DOC, and DOCX files are allowed");
      event.target.value = "";
      return;
    }

    updateField("attachment", file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError("");
    setError("");
    setSuccess("");

    if (validation.errors.length > 0) {
      setError(validation.errors[0]);
      return;
    }

    if (validation.warnings.length > 0) {
      setError(validation.warnings[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("fromDate", form.fromDate);
      payload.append("toDate", form.toDate);
      payload.append("reason", form.reason.trim());
      payload.append("isHalfDay", String(form.isHalfDay));

      if (form.isHalfDay && form.halfDayType) {
        payload.append("halfDayType", form.halfDayType);
      }

      if (form.attachment) {
        payload.append("attachment", form.attachment);
      }

      await applyLeaveRequest(payload);

      setSuccess("Leave request submitted successfully.");
      setForm(INITIAL_FORM);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Failed to apply leave"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Apply Leave"
      subtitle="Submit a duty leave request for dean approval."
    >
      {isLoadingContext ? (
        <section className="mb-4">
          <LoadingState label="Loading leave rules and holidays..." />
        </section>
      ) : null}

      <ErrorAlert message={contextError} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="fromDate"
              >
                From Date
              </label>
              <DatePicker
                id="fromDate"
                selected={fromDatePickerValue}
                onChange={(date) => handleDateChange("fromDate", date)}
                filterDate={filterSelectableDate}
                minDate={minSelectableDate || undefined}
                maxDate={maxSelectableDate || undefined}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                autoComplete="off"
                onChangeRaw={(event) => event.preventDefault()}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="toDate"
              >
                To Date
              </label>
              <DatePicker
                id="toDate"
                selected={toDatePickerValue}
                onChange={(date) => handleDateChange("toDate", date)}
                filterDate={filterToDate}
                minDate={minToDate || undefined}
                maxDate={maxSelectableDate || undefined}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                autoComplete="off"
                onChangeRaw={(event) => event.preventDefault()}
                disabled={form.isHalfDay}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {fieldError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {fieldError}
            </div>
          ) : null}

          {validation.errors.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="mb-2 font-semibold">Fix these before submitting:</p>
              <ul className="list-disc pl-5">
                {validation.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {validation.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="mb-2 font-semibold">Warnings:</p>
              <ul className="list-disc pl-5">
                {validation.warnings.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              Calculated Leave Days:
            </span>{" "}
            {calculatedDays || 0}
          </div>

          {balance?.yearName ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                Active Leave Year:
              </span>{" "}
              {balance.yearName}
              {balance.startDate && balance.endDate ? (
                <p className="mt-1 text-xs text-slate-600">
                  {toDateKey(balance.startDate)} to {toDateKey(balance.endDate)}{" "}
                  | Yearly Limit: {balance.yearlyLimit}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              {selectedMonthLabel} Usage:
            </span>{" "}
            {currentMonthUsed} / {monthlyLimit}
            {form.fromDate && calculatedDays > 0 ? (
              <p className="mt-1 text-xs text-slate-600">
                Projected after this request: {projectedMonthUsage} /{" "}
                {monthlyLimit}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="reason"
            >
              Reason
            </label>
            <textarea
              id="reason"
              rows="4"
              value={form.reason}
              onChange={(event) => updateField("reason", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Explain why the leave is required"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  id="isHalfDay"
                  type="checkbox"
                  checked={form.isHalfDay}
                  onChange={(event) =>
                    updateField("isHalfDay", event.target.checked)
                  }
                />
                <label htmlFor="isHalfDay" className="text-sm text-slate-700">
                  Apply as half day
                </label>
              </div>

              {form.isHalfDay ? (
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700"
                    htmlFor="halfDayType"
                  >
                    Half Day Type
                  </label>
                  <select
                    id="halfDayType"
                    value={form.halfDayType}
                    onChange={(event) =>
                      updateField("halfDayType", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="first_half">First Half</option>
                    <option value="second_half">Second Half</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="attachment"
              >
                Supporting Document (optional)
              </label>
              <input
                id="attachment"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleAttachmentChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {selectedFileName ? (
                <p className="mt-1 text-xs text-slate-500">
                  Selected file: {selectedFileName}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Allowed formats: PDF, DOC, DOCX
                </p>
              )}
            </div>
          </div>

          <ErrorAlert message={error} />
          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingContext || isInvalid}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Leave"}
            </button>
            <Link
              to="/dashboard"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

export default LeaveApply;
