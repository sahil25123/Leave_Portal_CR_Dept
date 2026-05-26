import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import PasswordField from "../components/forms/PasswordField";
import { getApiErrorMessage } from "../services/api";
import {
  resetPasswordRequest,
  validateResetTokenRequest,
} from "../services/auth.service";
import { getPasswordValidationMessage } from "../utils/passwordValidation";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isActive = true;

    async function validateToken() {
      setIsValidating(true);
      setError("");

      try {
        await validateResetTokenRequest(token);

        if (isActive) {
          setIsTokenValid(true);
        }
      } catch (requestError) {
        if (isActive) {
          setIsTokenValid(false);
          setError(
            getApiErrorMessage(
              requestError,
              "Reset token is invalid or expired",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsValidating(false);
        }
      }
    }

    if (!token) {
      setIsValidating(false);
      setIsTokenValid(false);
      setError("Reset token is missing");
      return () => {
        isActive = false;
      };
    }

    validateToken();

    return () => {
      isActive = false;
    };
  }, [token]);

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
    isValidating ||
    !isTokenValid ||
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
      await resetPasswordRequest({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setSuccess("Password reset successfully. Redirecting to login...");
      setForm({ newPassword: "", confirmPassword: "" });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to reset password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <main className="grid place-items-center p-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Validating reset link...
          </p>
        </section>
      </main>
    );
  }

  if (!isTokenValid) {
    return (
      <main className="grid place-items-center p-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Reset Link Invalid
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The reset link is invalid or has expired. Please request a new one.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              to="/forgot-password"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Login
            </Link>
          </div>
          <ErrorAlert message={error} />
        </section>
      </main>
    );
  }

  return (
    <main className="grid place-items-center p-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Reset Password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new password for your IITD leave portal account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

          <ErrorAlert message={error} />

          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ResetPassword;
