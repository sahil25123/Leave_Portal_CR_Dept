import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logoImage from "../assets/IITD logo.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const links = [
    { to: "/dashboard", label: "Dashboard", roles: ["staff", "dean", "admin"] },
    { to: "/apply-leave", label: "Apply Leave", roles: ["staff"] },
    { to: "/approvals", label: "Approvals", roles: ["dean"] },
    { to: "/admin", label: "Admin", roles: ["admin"] },
    { to: "/admin/users", label: "Users", roles: ["admin"] },
    { to: "/admin/holidays", label: "Holidays", roles: ["admin"] },
    { to: "/admin/leaves", label: "All Leaves", roles: ["admin"] },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user?.role));

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="IIT Delhi Corporate Relations"
              className="h-12 w-auto object-contain"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Corporate Relations
              </p>
              <p className="text-xs text-slate-500">Leave Management System</p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {user?.role}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <>
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    "rounded-md px-3 py-2 text-sm font-medium " +
                    (isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100")
              }
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
