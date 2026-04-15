import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import { getApiErrorMessage } from "../services/api";
import { applyLeaveRequest } from "../services/leave.service";

const INITIAL_FORM = {
  fromDate: "",
  toDate: "",
  reason: "",
  isHalfDay: false,
  attachment: "",
};

function LeaveApply() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    setIsSubmitting(true);

    try {
      await applyLeaveRequest({
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason,
        isHalfDay: form.isHalfDay,
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
                value={form.fromDate}
                onChange={(event) =>
                  updateField("fromDate", event.target.value)
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
                value={form.toDate}
                onChange={(event) => updateField("toDate", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
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
              disabled={isSubmitting}
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
