function HolidayForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  isEditing,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h3 className="text-base font-semibold text-slate-900">
        {isEditing ? "Edit Holiday" : "Add Holiday"}
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="holiday-name">
          Name
        </label>
        <input
          id="holiday-name"
          type="text"
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Republic Day"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="holiday-date">
          Date
        </label>
        <input
          id="holiday-date"
          type="date"
          value={values.date}
          onChange={(event) => onChange("date", event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting
          ? isEditing
            ? "Saving..."
            : "Adding..."
          : isEditing
            ? "Save Changes"
            : "Add Holiday"}
      </button>

      {isEditing ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="ml-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Cancel
        </button>
      ) : null}
    </form>
  );
}

export default HolidayForm;
