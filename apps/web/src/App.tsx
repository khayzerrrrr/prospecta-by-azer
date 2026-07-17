import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { listenForReconnect, syncQueue } from "./services/offline";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";

const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const LeadDetailPage = lazy(() => import("./pages/LeadDetailPage"));
const PipelinePage = lazy(() => import("./pages/PipelinePage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const VisitsPage = lazy(() => import("./pages/VisitsPage"));
const VisitDetailPage = lazy(() => import("./pages/VisitDetailPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const FollowUpsPage = lazy(() => import("./pages/FollowUpsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const EmployeeDetailPage = lazy(() => import("./pages/EmployeeDetailPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const PayrollPage = lazy(() => import("./pages/PayrollPage"));
const PayrollRunDetailPage = lazy(() => import("./pages/PayrollRunDetailPage"));
const PayslipDetailPage = lazy(() => import("./pages/PayslipDetailPage"));
const KpiPage = lazy(() => import("./pages/KpiPage"));
const PlatformCompaniesPage = lazy(() => import("./pages/PlatformCompaniesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
    listenForReconnect();
    if (navigator.onLine) syncQueue();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Suspense fallback={<LoadingPage />}><LeadsPage /></Suspense>} />
        <Route path="/leads/:id" element={<Suspense fallback={<LoadingPage />}><LeadDetailPage /></Suspense>} />
        <Route path="/calendar" element={<Suspense fallback={<LoadingPage />}><CalendarPage /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={<LoadingPage />}><MapPage /></Suspense>} />
        <Route path="/pipeline" element={<Suspense fallback={<LoadingPage />}><PipelinePage /></Suspense>} />
        <Route path="/visits" element={<Suspense fallback={<LoadingPage />}><VisitsPage /></Suspense>} />
        <Route path="/visits/:id" element={<Suspense fallback={<LoadingPage />}><VisitDetailPage /></Suspense>} />
        <Route path="/routes" element={<Suspense fallback={<LoadingPage />}><RoutesPage /></Suspense>} />
        <Route path="/follow-ups" element={<Suspense fallback={<LoadingPage />}><FollowUpsPage /></Suspense>} />
        <Route path="/analytics" element={<Suspense fallback={<LoadingPage />}><AnalyticsPage /></Suspense>} />
        <Route path="/team" element={<Suspense fallback={<LoadingPage />}><TeamPage /></Suspense>} />
        <Route path="/employees" element={<Suspense fallback={<LoadingPage />}><EmployeesPage /></Suspense>} />
        <Route path="/employees/:id" element={<Suspense fallback={<LoadingPage />}><EmployeeDetailPage /></Suspense>} />
        <Route path="/attendance" element={<Suspense fallback={<LoadingPage />}><AttendancePage /></Suspense>} />
        <Route path="/payroll" element={<Suspense fallback={<LoadingPage />}><PayrollPage /></Suspense>} />
        <Route path="/payroll/runs/:id" element={<Suspense fallback={<LoadingPage />}><PayrollRunDetailPage /></Suspense>} />
        <Route path="/payroll/payslips/:id" element={<Suspense fallback={<LoadingPage />}><PayslipDetailPage /></Suspense>} />
        <Route path="/kpi" element={<Suspense fallback={<LoadingPage />}><KpiPage /></Suspense>} />
        <Route path="/platform/companies" element={<Suspense fallback={<LoadingPage />}><PlatformCompaniesPage /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<LoadingPage />}><SettingsPage /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<LoadingPage />}><ProfilePage /></Suspense>} />
      </Route>
    </Routes>
  );
}
