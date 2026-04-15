import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { getApiErrorMessage } from "../services/api";
import { getDeanDashboardOverviewRequest } from "../services/leave.service";
import { formatDate, formatLeaveStatus } from "../utils/formatters";

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-green-200 bg-green-50 text-green-900",
    red: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <article
      className={"rounded-lg border p-4 " + (tones[tone] || tones.slate)}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}

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

function DeanDashboard() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    setIsLoading(true);
    setError("");

    try {
      const data = await getDeanDashboardOverviewRequest();
      setOverview(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load dashboard"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const metrics = overview?.metrics || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  };

  const recentActivity = overview?.recentActivity || [];
  const topUsers = overview?.topUsers || [];

  return (
    <AppShell
      title="Dean Dashboard"
      subtitle={
        "Overview of requests for " + (overview?.month || "this month") + "."
      }
    >
      <ErrorAlert message={error} />

      {isLoading ? (
        <LoadingState label="Loading dashboard overview..." />
      ) : null}

      {!isLoading ? (
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Requests" value={metrics.totalRequests} />
            <StatCard
              label="Pending Requests"
              value={metrics.pendingRequests}
              tone="amber"
            />
            <StatCard
              label="Approved Requests"
              value={metrics.approvedRequests}
              tone="green"
            />
            <StatCard
              label="Rejected Requests"
              value={metrics.rejectedRequests}
              tone="red"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h3>
              <Link
                to="/approvals"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Open Approvals
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No requests this month.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Date Range</th>
                      <th className="py-2 pr-3">Days</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((leave) => (
                      <tr key={leave.id} className="border-b border-slate-100">
                        <td className="py-3 pr-3 font-medium text-slate-900">
                          {leave.userName}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">
                          {formatDate(leave.fromDate)} to{" "}
                          {formatDate(leave.toDate)}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">
                          {leave.totalDays}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={leave.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Top Users
            </h3>

            {topUsers.length === 0 ? (
              <p className="text-sm text-slate-500">
                No approved usage in this month.
              </p>
            ) : (
              <div className="space-y-2">
                {topUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.designation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {user.totalDays} day(s)
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.requestCount} approved request(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

export default DeanDashboard;
