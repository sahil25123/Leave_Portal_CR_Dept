import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import PasswordField from "../components/forms/PasswordField";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/api";
import { changePasswordRequest } from "../services/auth.service";
import { getPasswordValidationMessage } from "../utils/passwordValidation";

const INITIAL_FORM = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mergeUser } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidationMessage = useMemo(
    () => getPasswordValidationMessage(form.newPassword),
    [form.newPassword],
  );

  const confirmValidationMessage =
    form.confirmPassword && form.newPassword !== form.confirmPassword
      ? "New password and confirm password do not match"
      : "";

  const isSubmitDisabled =
    isSubmitting ||
    !form.oldPassword ||
    !form.newPassword ||
    !form.confirmPassword ||
    Boolean(passwordValidationMessage) ||
    Boolean(confirmValidationMessage);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      return;
    }

    if (confirmValidationMessage) {
      setError(confirmValidationMessage);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await changePasswordRequest(form);

      mergeUser({
        ...response.user,
        mustChangePassword: false,
      });

      setSuccess("Password updated successfully.");
      setForm(INITIAL_FORM);

      const redirectPath =
        location.state?.from && location.state.from !== "/change-password"
          ? location.state.from
          : "/dashboard";

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 900);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to change password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Change Password"
      subtitle="Use a strong password to secure your leave portal account."
    >
      {success ? (
        <div className="fixed right-4 top-20 z-50 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
          {success}
        </div>
      ) : null}

      <section className="mx-auto w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField
            id="old-password"
            label="Old Password"
            value={form.oldPassword}
            onChange={(event) => updateField("oldPassword", event.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />

          <PasswordField
            id="new-password"
            label="New Password"
            value={form.newPassword}
            onChange={(event) => updateField("newPassword", event.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            required
            errorText={form.newPassword ? passwordValidationMessage : ""}
            helperText={
              !form.newPassword
                ? "Password must contain uppercase, lowercase, number, and special character"
                : ""
            }
          />

          <PasswordField
            id="confirm-password"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
            placeholder="Re-enter new password"
            autoComplete="new-password"
            required
            errorText={confirmValidationMessage}
          />

          <ErrorAlert message={error} />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}

export default ChangePassword;
