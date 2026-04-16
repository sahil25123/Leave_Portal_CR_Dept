import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../hooks/useAuth";

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppShell
      title="Profile"
      subtitle="Review your account details and security settings."
    >
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Name
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {user?.name || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {user?.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Role
            </p>
            <p className="mt-1 font-medium capitalize text-slate-900">
              {user?.role || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Designation
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {user?.designation || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => navigate("/change-password")}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Change Password
          </button>
        </div>
      </section>
    </AppShell>
  );
}

export default Profile;
