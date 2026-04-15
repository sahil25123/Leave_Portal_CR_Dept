import { formatDate, formatLeaveStatus } from "../utils/formatters";

function LeaveTable({ leaves }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">From Date</th>
            <th className="px-4 py-3">To Date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-slate-900">{leave.user?.name || "-"}</td>
              <td className="px-4 py-3 text-slate-700">{formatDate(leave.fromDate)}</td>
              <td className="px-4 py-3 text-slate-700">{formatDate(leave.toDate)}</td>
              <td className="px-4 py-3 text-slate-700">{formatLeaveStatus(leave.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveTable;
