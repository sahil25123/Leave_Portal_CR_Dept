import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/LoadingState";

function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <LoadingState label="Restoring session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return (
      <Navigate
        to="/change-password"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
