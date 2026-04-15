import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ApprovalModal from "../components/ApprovalModal";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { getApiErrorMessage } from "../services/api";
import {
  approveByDeanRequest,
  getDeanPendingLeavesRequest,
  rejectByDeanRequest,
  resolveUploadUrl,
} from "../services/leave.service";
import { formatDate } from "../utils/formatters";

function Approvals() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLeaveId, setProcessingLeaveId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPendingLeaves() {
    setIsLoading(true);
    setError("");

    try {
      const leaves = await getDeanPendingLeavesRequest();
      setPendingLeaves(leaves);
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Failed to load pending leave requests"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  function openModal(leave) {
    setError("");
    setSuccess("");
    setSelectedLeave(leave);
  }

  function closeModal() {
    if (isProcessing) {
      return;
    }

    setSelectedLeave(null);
  }

  async function handleApprove(leaveId) {
    setIsProcessing(true);
    setProcessingLeaveId(leaveId);
    setError("");
    setSuccess("");

    try {
      await approveByDeanRequest(leaveId);
      setPendingLeaves((current) =>
        current.filter((leave) => leave.id !== leaveId),
      );
      setSelectedLeave(null);
      setSuccess("Leave approved successfully.");
    } catch (actionError) {
      const message = getApiErrorMessage(
        actionError,
        "Failed to approve leave",
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsProcessing(false);
      setProcessingLeaveId(null);
    }
  }

  async function handleReject(leaveId, remarks) {
    setIsProcessing(true);
    setProcessingLeaveId(leaveId);
    setError("");
    setSuccess("");

    try {
      await rejectByDeanRequest(leaveId, remarks);
      setPendingLeaves((current) =>
        current.filter((leave) => leave.id !== leaveId),
      );
      setSelectedLeave(null);
      setSuccess("Leave rejected successfully.");
    } catch (actionError) {
      const message = getApiErrorMessage(actionError, "Failed to reject leave");
      setError(message);
      throw new Error(message);
    } finally {
      setIsProcessing(false);
      setProcessingLeaveId(null);
    }
  }

  return (
    <AppShell
      title="Approvals"
      subtitle="Review pending leave requests and take action from detailed modal view."
    >
      <ErrorAlert message={error} />
      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {isLoading ? <LoadingState label="Loading pending requests..." /> : null}

      {!isLoading && pendingLeaves.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No pending leave requests.
        </section>
      ) : null}

      {!isLoading && pendingLeaves.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Pending Requests
            </h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingLeaves.length} pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Days</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-900">
                        {leave.user.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {leave.user.designation}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {leave.totalDays}
                    </td>
                    <td className="max-w-md py-3 pr-3 text-slate-700">
                      {leave.reason}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {leave.attachment ? (
                          <a
                            href={resolveUploadUrl(leave.attachment)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View Document
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => openModal(leave)}
                          disabled={
                            isProcessing || processingLeaveId === leave.id
                          }
                          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {processingLeaveId === leave.id
                            ? "Processing..."
                            : "View Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ApprovalModal
        isOpen={Boolean(selectedLeave)}
        leave={selectedLeave}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </AppShell>
  );
}

export default Approvals;
