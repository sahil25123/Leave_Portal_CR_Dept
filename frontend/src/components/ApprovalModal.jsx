import { useEffect, useState } from "react";
import ErrorAlert from "./ErrorAlert";
import LoadingState from "./LoadingState";
import { getApiErrorMessage } from "../services/api";
import {
  getLeaveUserDetailsForDeanRequest,
  resolveUploadUrl,
} from "../services/leave.service";
import { formatDate, formatLeaveStatus } from "../utils/formatters";

function ApprovalModal({
  isOpen,
  leave,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}) {
  const [details, setDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen || !leave?.user?.id) {
      return;
    }

    let isActive = true;

    async function loadDetails() {
      setIsLoadingDetails(true);
      setDetailsError("");
      setActionError("");
      setRemarks("");

      try {
        const response = await getLeaveUserDetailsForDeanRequest(leave.user.id);

        if (isActive) {
          setDetails(response);
        }
      } catch (error) {
        if (isActive) {
          setDetailsError(
            getApiErrorMessage(error, "Failed to load leave details"),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingDetails(false);
        }
      }
    }

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [isOpen, leave?.id, leave?.user?.id]);

  if (!isOpen || !leave) {
    return null;
  }

  const user = details?.user || leave.user;
  const userEmail = details?.user?.email || leave.user?.email;
  const leaveBalance = details?.leaveBalance;
  const monthlyUsage = details?.monthlyUsage;
  const previousLeaves = details?.lastLeaves || details?.previousLeaves || [];
  const attachmentUrl = resolveUploadUrl(leave.attachment);

  async function handleApproveClick() {
    setActionError("");

    try {
      await onApprove(leave.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to approve leave"));
    }
  }

  async function handleRejectClick() {
    const trimmedRemarks = String(remarks || "").trim();

    if (!trimmedRemarks) {
      setActionError("Remarks are required for rejection");
      return;
    }

    setActionError("");

    try {
      await onReject(leave.id, trimmedRemarks);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to reject leave"));
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Leave Approval Details
          </h3>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          <ErrorAlert message={detailsError || actionError} />

          {isLoadingDetails ? (
            <LoadingState label="Loading applicant details..." />
          ) : null}

          {!isLoadingDetails ? (
            <>
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User Info
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {user?.name}
                  </p>
                  {userEmail ? (
                    <p className="text-sm text-slate-700">{userEmail}</p>
                  ) : null}
                  <p className="text-sm text-slate-700">{user?.designation}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Leave Details
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}
                  </p>
                  <p className="text-sm text-slate-800">
                    Days: {leave.totalDays}
                  </p>
                  <p className="text-sm text-slate-800">
                    Status: {formatLeaveStatus(leave.status || "pending_dean")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{leave.reason}</p>
                  {attachmentUrl ? (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View Document
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      No document attached
                    </p>
                  )}
                </div>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
                <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Leave Balance
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Total: {leaveBalance?.total ?? 0}
                  </p>
                  <p className="text-sm text-slate-700">
                    Used: {leaveBalance?.used ?? 0}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    Remaining: {leaveBalance?.remaining ?? 0}
                  </p>
                </article>

                <article className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Monthly Usage
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {monthlyUsage?.month || "Current Month"}
                  </p>
                  <p className="text-sm text-slate-700">
                    Total: {monthlyUsage?.totalDays ?? 0} day(s)
                  </p>
                  <p className="text-sm text-slate-700">
                    Approved: {monthlyUsage?.approvedDays ?? 0} day(s)
                  </p>
                  <p className="text-sm text-slate-700">
                    Pending: {monthlyUsage?.pendingDays ?? 0} day(s)
                  </p>
                </article>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">
                  Previous Leave History (Last 5)
                </h4>

                {previousLeaves.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No previous leave history found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600">
                          <th className="py-2 pr-3">Date Range</th>
                          <th className="py-2 pr-3">Days</th>
                          <th className="py-2 pr-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousLeaves.map((historyItem) => (
                          <tr
                            key={historyItem.id}
                            className="border-b border-slate-100 align-top"
                          >
                            <td className="py-2 pr-3 text-slate-700">
                              {formatDate(historyItem.fromDate)} to{" "}
                              {formatDate(historyItem.toDate)}
                            </td>
                            <td className="py-2 pr-3 text-slate-700">
                              {historyItem.totalDays}
                            </td>
                            <td className="py-2 pr-3 text-slate-700">
                              {formatLeaveStatus(historyItem.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="approval-remarks"
                >
                  Remarks {"("}required for rejection{")"}
                </label>
                <textarea
                  id="approval-remarks"
                  rows="3"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Write remarks for rejection or additional notes"
                  disabled={isProcessing}
                />
              </section>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isProcessing || isLoadingDetails}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={handleRejectClick}
                  disabled={isProcessing || isLoadingDetails}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ApprovalModal;
