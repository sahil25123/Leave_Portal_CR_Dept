import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import {
  getMonthlyLeaveSummaryRequest,
  getMyLeaveBalanceRequest,
  getMyLeaveHistoryRequest,
} from "../services/leave.service";
import { getApiErrorMessage } from "../services/api";
import { formatDate, formatLeaveStatus } from "../utils/formatters";

function StatusBadge({ status }) {
  const styles = {
    pending_dean: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-xs font-semibold " +
        (styles[status] || "bg-slate-100 text-slate-700")
      }
    >
      {formatLeaveStatus(status)}
    </span>
  );
}

function StaffDashboard() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStaffDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [balanceData, historyData, monthlySummaryData] =
          await Promise.all([
            getMyLeaveBalanceRequest(),
            getMyLeaveHistoryRequest(),
            getMonthlyLeaveSummaryRequest(),
          ]);

        setBalance(balanceData);
        setHistory(historyData);
        setMonthlySummary(monthlySummaryData);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Failed to load dashboard"));
      } finally {
        setIsLoading(false);
      }
    }

    loadStaffDashboard();
  }, []);

  return (
    <AppShell
      title="Staff Dashboard"
      subtitle="Track leave balance and request status in one place."
    >
      <ErrorAlert message={error} />

      {isLoading ? <LoadingState label="Loading your dashboard..." /> : null}

      {!isLoading && balance ? (
        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {balance.total}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Used</p>
              <p className="text-2xl font-bold text-slate-900">
                {balance.used}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Remaining</p>
              <p className="text-2xl font-bold text-slate-900">
                {balance.remaining}
              </p>
            </article>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Monthly Leave Usage
            </h3>

            {monthlySummary.length === 0 ? (
              <p className="text-sm text-slate-500">
                No monthly leave usage yet.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {monthlySummary.map((entry) => (
                  <article
                    key={entry.month}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.month}
                    </p>
                    <p className="text-sm text-slate-700">
                      {entry.totalDays} / 2.5
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {!isLoading ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Leave History
            </h3>
            <Link
              to="/apply-leave"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Apply Leave
            </Link>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Period</th>
                    <th className="py-2">Days</th>
                    <th className="py-2">Reason</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((leave) => (
                    <tr
                      key={leave.id}
                      className="border-b border-slate-100 align-top"
                    >
                      <td className="py-3 pr-3">
                        {formatDate(leave.fromDate)} to{" "}
                        {formatDate(leave.toDate)}
                      </td>
                      <td className="py-3 pr-3">{leave.totalDays}</td>
                      <td className="py-3 pr-3 max-w-xs">{leave.reason}</td>
                      <td className="py-3">
                        <StatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}

export default StaffDashboard;
