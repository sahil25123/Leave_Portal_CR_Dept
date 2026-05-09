import { getPasswordValidationMessage } from "../../utils/passwordValidation";
import PasswordField from "./PasswordField";

function UserForm({
  mode = "create",
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const isCreate = mode === "create";
  const passwordValidationMessage = isCreate
    ? getPasswordValidationMessage(values.password)
    : "";
  const isSubmitDisabled =
    isSubmitting || (isCreate && Boolean(passwordValidationMessage));

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h3 className="text-base font-semibold text-slate-900">
        {isCreate ? "Add User" : "Edit User"}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor={mode + "-name"}
          >
            Name
          </label>
          <input
            id={mode + "-name"}
            type="text"
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor={mode + "-designation"}
          >
            Designation
          </label>
          <input
            id={mode + "-designation"}
            type="text"
            value={values.designation}
            onChange={(event) => onChange("designation", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor={mode + "-email"}
          >
            Email
          </label>
          <input
            id={mode + "-email"}
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {isCreate ? (
          <div>
            <PasswordField
              id="create-password"
              label="Password"
              value={values.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
              errorText={values.password ? passwordValidationMessage : ""}
              helperText={
                !values.password
                  ? "Password must contain uppercase, lowercase, number, and special character"
                  : ""
              }
            />
          </div>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-slate-700"
          htmlFor={mode + "-role"}
        >
          Role
        </label>
        <select
          id={mode + "-role"}
          value={values.role}
          onChange={(event) => onChange("role", event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="staff">staff</option>
          <option value="dean">dean</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting
            ? "Saving..."
            : isCreate
              ? "Create User"
              : "Save Changes"}
        </button>

        {!isCreate ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default UserForm;
