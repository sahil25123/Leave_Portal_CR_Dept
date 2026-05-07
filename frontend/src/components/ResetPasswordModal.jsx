import { useEffect, useMemo, useState } from "react";
import ErrorAlert from "./ErrorAlert";
import PasswordField from "./forms/PasswordField";
import { getApiErrorMessage } from "../services/api";
import { getPasswordValidationMessage } from "../utils/passwordValidation";

const INITIAL_FORM = {
  newPassword: "",
  confirmPassword: "",
};

function ResetPasswordModal({ isOpen, user, onClose, onSubmit, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setError("");
      setIsSubmitting(false);
      return;
    }

    setForm(INITIAL_FORM);
    setError("");
    setIsSubmitting(false);
  }, [isOpen, user?.id]);

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
      await onSubmit(user.id, {
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setForm(INITIAL_FORM);

      if (onSuccess) {
        onSuccess("Password reset successfully.");
      }

      onClose();
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        "Failed to reset password",
      );
      setError(message);

      if (onSuccess) {
        onSuccess(message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Reset Password
            </h3>
            <p className="text-sm text-slate-500">
              {user.name} ({user.email})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <ErrorAlert message={error} />

          <PasswordField
            id="reset-new-password"
            label="New Password"
            value={form.newPassword}
            onChange={(event) => updateField("newPassword", event.target.value)}
            placeholder="Enter a strong password"
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
            id="reset-confirm-password"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
            placeholder="Re-enter the new password"
            autoComplete="new-password"
            required
            errorText={confirmValidationMessage}
          />

          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This will force the user to change their password on next login.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
