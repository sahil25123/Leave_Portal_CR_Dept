import { useState } from "react";
import { Link } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import { forgotPasswordRequest } from "../services/auth.service";
import { getApiErrorMessage } from "../services/api";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPasswordRequest({ email: normalizedEmail });
      setSuccess("If the email exists, a reset link has been sent.");
      setEmail("");
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "If the email exists, a reset link has been sent.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid place-items-center p-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Forgot Password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your registered email to receive a secure reset link.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="name@iitd.ac.in"
            />
          </div>

          <ErrorAlert message={error} />

          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Sending Link..." : "Send Reset Link"}
          </button>

          <div className="text-center text-sm text-slate-600">
            <Link
              to="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ForgotPassword;
