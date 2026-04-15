import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import HolidayTable from "../components/HolidayTable";
import HolidayForm from "../components/forms/HolidayForm";
import {
  createHolidayRequest,
  deleteHolidayRequest,
  getHolidaysRequest,
  syncHolidaysRequest,
} from "../services/admin.service";
import { getApiErrorMessage } from "../services/api";

const INITIAL_FORM = {
  name: "",
  date: "",
};

function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncYear, setSyncYear] = useState(new Date().getUTCFullYear());

  async function loadHolidays() {
    setIsLoading(true);
    setError("");

    try {
      const holidayList = await getHolidaysRequest();
      setHolidays(holidayList);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load holidays"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHolidays();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const holiday = await createHolidayRequest(form);
      setHolidays((current) => [...current, holiday]);
      setForm(INITIAL_FORM);
      setSuccess("Holiday added successfully.");
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Failed to add holiday"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(holidayId) {
    setDeletingId(holidayId);
    setError("");
    setSuccess("");

    try {
      await deleteHolidayRequest(holidayId);
      setHolidays((current) =>
        current.filter((holiday) => holiday.id !== holidayId),
      );
      setSuccess("Holiday deleted successfully.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Failed to delete holiday"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    setError("");
    setSuccess("");

    try {
      const result = await syncHolidaysRequest(syncYear);
      const holidayList = await getHolidaysRequest();
      setHolidays(holidayList);
      setSuccess(
        "Synced " +
          (result?.syncedCount ?? 0) +
          " holidays for year " +
          (result?.year ?? syncYear) +
          ".",
      );
    } catch (syncError) {
      setError(getApiErrorMessage(syncError, "Failed to sync holidays"));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <AppShell
      title="Holiday Management"
      subtitle="Configure holidays used to exclude leave-day calculations."
    >
      <ErrorAlert message={error} />
      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="sync-year"
            >
              Sync Year
            </label>
            <input
              id="sync-year"
              type="number"
              min="1900"
              max="3000"
              value={syncYear}
              onChange={(event) => setSyncYear(Number(event.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:w-40"
            />
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSyncing ? "Syncing holidays..." : "Sync Holidays"}
          </button>
        </div>
      </section>

      <section className="mb-5">
        <HolidayForm
          values={form}
          onChange={updateField}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      </section>

      <section>
        {isLoading ? (
          <LoadingState label="Loading holidays..." />
        ) : (
          <HolidayTable
            holidays={holidays}
            deletingId={deletingId}
            onDelete={handleDelete}
          />
        )}
      </section>
    </AppShell>
  );
}

export default HolidayManagement;
