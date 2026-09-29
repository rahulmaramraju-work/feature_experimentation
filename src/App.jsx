import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { FlagToast, SupportBot, ThemeColor } from './flags/FlagVisuals';
import ControlTower from './flags/ControlTower';
import { Spinner } from './components/ui';
import MarketingLayout from './components/MarketingLayout';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import PricingPage from './pages/PricingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/app/Dashboard';
import Projects from './pages/app/Projects';
import Insights from './pages/app/Insights';
import Reports from './pages/app/Reports';
import Team from './pages/app/Team';
import Billing from './pages/app/Billing';
import Settings from './pages/app/Settings';
import Admin from './pages/app/Admin';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ThemeColor />
      <FlagToast />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="insights" element={<Insights />} />
          <Route path="reports" element={<Reports />} />
          <Route path="team" element={<Team />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SupportBot />
      <ControlTower />
    </>
  );
}
