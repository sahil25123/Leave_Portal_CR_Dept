import { formatDate } from "../utils/formatters";

function HolidayTable({ holidays, deletingId, onDelete, onEdit, editingId }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id} className="border-b border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">
                {holiday.name}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {formatDate(holiday.date)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(holiday)}
                  className="mr-2 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  {editingId === holiday.id ? "Editing" : "Edit"}
                </button>

                <button
                  type="button"
                  disabled={deletingId === holiday.id}
                  onClick={() => onDelete(holiday.id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {deletingId === holiday.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HolidayTable;
