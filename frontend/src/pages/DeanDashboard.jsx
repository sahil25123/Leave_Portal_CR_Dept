import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { getApiErrorMessage } from "../services/api";
import {
  approveByDeanRequest,
  getDeanPendingLeavesRequest,
  rejectByDeanRequest,
} from "../services/leave.service";
import { formatDate } from "../utils/formatters";

function DeanDashboard() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMap, setActionMap] = useState({});

  async function loadPendingLeaves() {
    setIsLoading(true);
    setError("");

    try {
      const leaves = await getDeanPendingLeavesRequest();
      setPendingLeaves(leaves);
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Failed to load pending requests"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  async function handleApprove(leaveId) {
    setActionMap((current) => ({ ...current, [leaveId]: true }));
    setError("");

    try {
      await approveByDeanRequest(leaveId);
      setPendingLeaves((current) =>
        current.filter((item) => item.id !== leaveId),
      );
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Failed to approve leave"));
    } finally {
      setActionMap((current) => ({ ...current, [leaveId]: false }));
    }
  }

  async function handleReject(leaveId) {
    const reason = window.prompt("Enter rejection reason");

    if (!reason || !reason.trim()) {
      return;
    }

    setActionMap((current) => ({ ...current, [leaveId]: true }));
    setError("");

    try {
      await rejectByDeanRequest(leaveId, reason.trim());
      setPendingLeaves((current) =>
        current.filter((item) => item.id !== leaveId),
      );
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Failed to reject leave"));
    } finally {
      setActionMap((current) => ({ ...current, [leaveId]: false }));
    }
  }

  return (
    <AppShell
      title="Dean Approvals"
      subtitle="Review and decide pending leave applications from staff."
    >
      <ErrorAlert message={error} />

      {isLoading ? <LoadingState label="Loading pending requests..." /> : null}

      {!isLoading && pendingLeaves.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No pending leave requests.
        </section>
      ) : null}

      {!isLoading && pendingLeaves.length > 0 ? (
        <section className="space-y-3">
          {pendingLeaves.map((leave) => {
            const isActionRunning = Boolean(actionMap[leave.id]);

            return (
              <article
                key={leave.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {leave.user.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {leave.user.designation}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}{" "}
                      ({leave.totalDays} day(s))
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {leave.reason}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      disabled={isActionRunning}
                      onClick={() => handleApprove(leave.id)}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                    >
                      {isActionRunning ? "Processing..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={isActionRunning}
                      onClick={() => handleReject(leave.id)}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </AppShell>
  );
}

export default DeanDashboard;
