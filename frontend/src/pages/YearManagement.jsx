import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import {
  activateLeaveYearRequest,
  createLeaveYearRequest,
  getActiveLeaveYearRequest,
  getLeaveYearsRequest,
} from "../services/admin.service";
import { getApiErrorMessage } from "../services/api";
import { formatDate } from "../utils/formatters";

const INITIAL_FORM = {
  name: "",
  startDate: "",
  endDate: "",
  yearlyLimit: "30",
};

function YearManagement() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadYearData() {
    setIsLoading(true);
    setError("");

    try {
      const [allYears, active] = await Promise.all([
        getLeaveYearsRequest(),
        getActiveLeaveYearRequest(),
      ]);

      setYears(allYears);
      setActiveYear(active || null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load leave years"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadYearData();
  }, []);

  function updateField(field, value) {
    setError("");
    setSuccess("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await createLeaveYearRequest({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        yearlyLimit: Number(form.yearlyLimit),
      });

      setForm(INITIAL_FORM);
      setSuccess("Leave year created successfully.");
      await loadYearData();
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Failed to create leave year"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleActivate(yearId) {
    setError("");
    setSuccess("");
    setActivatingId(yearId);

    try {
      await activateLeaveYearRequest(yearId);
      setSuccess("Leave year activated successfully.");
      await loadYearData();
    } catch (activateError) {
      setError(
        getApiErrorMessage(activateError, "Failed to activate leave year"),
      );
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <AppShell
      title="Year Management"
      subtitle="Define leave cycles and activate the one used for all leave calculations."
    >
      <ErrorAlert message={error} />
      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {isLoading ? <LoadingState label="Loading leave years..." /> : null}

      {!isLoading ? (
        <section className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              Active Leave Year
            </h3>
            {activeYear ? (
              <div className="mt-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  {activeYear.name}
                </p>
                <p>
                  {formatDate(activeYear.startDate)} to{" "}
                  {formatDate(activeYear.endDate)}
                </p>
                <p>Yearly Limit: {activeYear.yearlyLimit} day(s)</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-700">
                No active leave year configured.
              </p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">
              Create Leave Year
            </h3>

            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="year-name"
                >
                  Name
                </label>
                <input
                  id="year-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="2026"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="year-start-date"
                >
                  Start Date
                </label>
                <input
                  id="year-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    updateField("startDate", event.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="year-end-date"
                >
                  End Date
                </label>
                <input
                  id="year-end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    updateField("endDate", event.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="yearly-limit"
                >
                  Yearly Limit
                </label>
                <input
                  id="yearly-limit"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.yearlyLimit}
                  onChange={(event) =>
                    updateField("yearlyLimit", event.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmitting ? "Creating..." : "Create Leave Year"}
                </button>
              </div>
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">
              All Leave Years
            </h3>

            {years.length === 0 ? (
              <p className="text-sm text-slate-500">
                No leave years defined yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Cycle</th>
                      <th className="py-2 pr-3">Limits</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {years.map((year) => (
                      <tr key={year.id} className="border-b border-slate-100">
                        <td className="py-3 pr-3 font-semibold text-slate-900">
                          {year.name}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">
                          {formatDate(year.startDate)} to{" "}
                          {formatDate(year.endDate)}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">
                          {year.yearlyLimit} / year
                        </td>
                        <td className="py-3 pr-3">
                          {year.isActive ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => handleActivate(year.id)}
                            disabled={year.isActive || activatingId === year.id}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            {activatingId === year.id
                              ? "Activating..."
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      ) : null}
    </AppShell>
  );
}

export default YearManagement;
