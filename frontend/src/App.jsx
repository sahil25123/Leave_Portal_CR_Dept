import { Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import HolidayManagement from "./pages/HolidayManagement";
import LeaveOverview from "./pages/LeaveOverview";
import Login from "./pages/Login";
import LeaveApply from "./pages/LeaveApply";
import Approvals from "./pages/Approvals";
import YearManagement from "./pages/YearManagement";
import UserManagement from "./pages/UserManagement";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
            <Route path="/apply-leave" element={<LeaveApply />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["dean"]} />}>
            <Route path="/approvals" element={<Approvals />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/years" element={<YearManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/holidays" element={<HolidayManagement />} />
            <Route path="/admin/leaves" element={<LeaveOverview />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
