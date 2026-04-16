import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logoImage from "../assets/IITD logo.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const links = [
    { to: "/dashboard", label: "Dashboard", roles: ["staff", "dean", "admin"] },
    { to: "/apply-leave", label: "Apply Leave", roles: ["staff"] },
    { to: "/approvals", label: "Approvals", roles: ["dean"] },
    { to: "/admin/years", label: "Years", roles: ["admin"] },
    { to: "/admin/users", label: "Users", roles: ["admin"] },
    { to: "/admin/holidays", label: "Holidays", roles: ["admin"] },
    { to: "/admin/leaves", label: "All Leaves", roles: ["admin"] },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user?.role));

  const userInitials = useMemo(() => {
    const fullName = String(user?.name || "").trim();

    if (!fullName) {
      return "U";
    }

    const parts = fullName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  function handleLogout() {
    setIsProfileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  function handleNavigate(path) {
    setIsProfileMenuOpen(false);
    navigate(path);
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoImage}
            alt="IIT Delhi Corporate Relations"
            className="h-12 w-auto object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900">
              Corporate Relations
            </p>
            <p className="text-xs text-slate-500">Leave Management System</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-2">
          {isAuthenticated
            ? visibleLinks.map((link) => (
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
              ))
            : null}
        </nav>

        <div className="flex justify-end">
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700"
                aria-label="Open profile menu"
              >
                {userInitials}
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.name}
                  </p>
                  <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                    {user?.role}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/profile")}
                    className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/change-password")}
                    className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
