import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import PasswordField from "../components/forms/PasswordField";
import { useAuth } from "../hooks/useAuth";

const ALLOWED_PORTAL_ROLES = ["staff", "dean", "admin"];

function Login() {
  const navigate = useNavigate();
  const { login, logout, user, isAuthenticated, isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const loginPayload = await login(email, password);
      const loggedInUser = loginPayload.user;

      if (!ALLOWED_PORTAL_ROLES.includes(loggedInUser.role)) {
        logout();
        setError("This role is not allowed to access this portal");
        return;
      }

      if (
        loginPayload.requirePasswordChange ||
        loggedInUser.mustChangePassword
      ) {
        navigate("/change-password", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasSupportedRole = ALLOWED_PORTAL_ROLES.includes(user?.role);

  if (!isAuthLoading && isAuthenticated && hasSupportedRole) {
    if (user?.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  if (!isAuthLoading && isAuthenticated && !hasSupportedRole) {
    return (
      <main className="grid place-items-center p-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Access Restricted
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Role "{user?.role}" is not allowed in this portal.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-5 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign Out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="grid place-items-center p-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Leave Portal Login
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your IITD corporate relations account.
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
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="name@iitd.ac.in"
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <ErrorAlert message={error} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
