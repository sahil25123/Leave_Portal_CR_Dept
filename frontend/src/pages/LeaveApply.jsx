import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { getApiErrorMessage } from "../services/api";
import {
  applyLeaveRequest,
  getLeaveHolidaysRequest,
  getMyLeaveHistoryRequest,
} from "../services/leave.service";
import {
  buildHolidayDateSet,
  calculateWorkingDays,
  checkMonthlyLimitWarning,
  checkOverlapWarning,
  isNonWorkingDate,
  isPastDate,
  toDateKey,
  toDateOnly,
} from "../utils/leaveValidation";

const INITIAL_FORM = {
  fromDate: "",
  toDate: "",
  reason: "",
  isHalfDay: false,
  halfDayType: "",
  attachment: "",
};

function LeaveApply() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [holidays, setHolidays] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayDate = useMemo(() => toDateKey(new Date()), []);
  const holidayDateSet = useMemo(
    () => buildHolidayDateSet(holidays),
    [holidays],
  );
  const holidayNameByDate = useMemo(() => {
    const map = new Map();

    for (const holiday of holidays) {
      const dateKey = toDateKey(holiday?.date);

      if (dateKey) {
        map.set(dateKey, holiday?.name || "Holiday");
      }
    }

    return map;
  }, [holidays]);

  const fromDate = useMemo(() => toDateOnly(form.fromDate), [form.fromDate]);
  const toDate = useMemo(() => toDateOnly(form.toDate), [form.toDate]);
  const calculatedDays = useMemo(() => {
    return calculateWorkingDays(
      form.fromDate,
      form.toDate,
      holidayDateSet,
      form.isHalfDay,
    );
  }, [form.fromDate, form.toDate, form.isHalfDay, holidayDateSet]);

  useEffect(() => {
    async function loadApplyLeaveContext() {
      setIsLoadingContext(true);
      setContextError("");

      try {
        const [holidayRows, historyRows] = await Promise.all([
          getLeaveHolidaysRequest(),
          getMyLeaveHistoryRequest(),
        ]);

        setHolidays(holidayRows);
        setHistory(historyRows);
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
      leaves: history,
      fromDate,
      toDate,
      isHalfDay: form.isHalfDay,
      halfDayType: form.halfDayType,
    });

    if (overlapWarning) {
      warnings.push(overlapWarning);
    }

    const monthlyWarning = checkMonthlyLimitWarning({
      leaves: history,
      fromDate,
      toDate,
      holidayDateSet,
      isHalfDay: form.isHalfDay,
    });

    if (monthlyWarning) {
      warnings.push(monthlyWarning);
    }

    return {
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
    };
  }, [
    calculatedDays,
    form.fromDate,
    form.halfDayType,
    form.isHalfDay,
    form.toDate,
    fromDate,
    history,
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
    if (!value) {
      updateField(field, "");
      return;
    }

    if (isPastDate(value)) {
      setFieldError("Past dates cannot be selected");
      return;
    }

    if (isNonWorkingDate(value, holidayDateSet)) {
      const holidayName = holidayNameByDate.get(value);

      if (holidayName) {
        setFieldError("Cannot select " + value + " (" + holidayName + ")");
      } else {
        setFieldError("Cannot apply leave on holiday or Sunday");
      }

      return;
    }

    updateField(field, value);
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
      await applyLeaveRequest({
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
        isHalfDay: form.isHalfDay,
        halfDayType: form.isHalfDay ? form.halfDayType : undefined,
        attachment: form.attachment || undefined,
      });

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
              <input
                id="fromDate"
                type="date"
                min={todayDate}
                value={form.fromDate}
                onChange={(event) =>
                  handleDateChange("fromDate", event.target.value)
                }
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
              <input
                id="toDate"
                type="date"
                min={form.fromDate || todayDate}
                value={form.toDate}
                onChange={(event) =>
                  handleDateChange("toDate", event.target.value)
                }
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
                Attachment URL (optional)
              </label>
              <input
                id="attachment"
                type="url"
                value={form.attachment}
                onChange={(event) =>
                  updateField("attachment", event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://example.com/document"
              />
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
