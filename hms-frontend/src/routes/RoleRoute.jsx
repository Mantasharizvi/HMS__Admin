import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../utils/modulePermissions';

/**
 * Guards a module's routes so a logged-in user who lacks access to that
 * module (e.g. a Pharmacist hitting /ipd, or Doctor/Nurse/Receptionist
 * hitting /users) is redirected instead of hitting the page directly by URL.
 * This is a UX safeguard only — the backend's authorizeModule middleware
 * is what actually enforces access on the API.
 *
 * Usage: <Route element={<RoleRoute module="pharmacy" />}> ...module routes... </Route>
 */
export default function RoleRoute({ module }) {
  const { user } = useAuth();

  if (!canAccessModule(user?.role, module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
