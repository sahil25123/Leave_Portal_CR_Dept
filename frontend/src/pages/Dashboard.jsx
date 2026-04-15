import { useAuth } from "../hooks/useAuth";
import AppShell from "../components/AppShell";
import AdminDashboard from "./AdminDashboard";
import DeanDashboard from "./DeanDashboard";
import StaffDashboard from "./StaffDashboard";

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "staff") {
    return <StaffDashboard />;
  }

  if (user?.role === "dean") {
    return <DeanDashboard />;
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return (
    <AppShell
      title="Access Restricted"
      subtitle="Only staff, dean, and admin roles are supported by this portal UI."
    >
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Your account role ({user?.role || "unknown"}) does not have a dashboard view.
      </section>
    </AppShell>
  );
}

export default Dashboard;
