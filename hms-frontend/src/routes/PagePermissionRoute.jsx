import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePagePermissions } from '../context/PagePermissionsContext';
import { PAGE_PERMISSIONS } from '../utils/modulePermissions';

/**
 * Guards every page by the SAME per-page permission the Sidebar uses to
 * decide what to show. RoleRoute only checks the coarse module (e.g. "can
 * this role open OPD at all") — this additionally blocks a specific page
 * within an allowed module if Admin hasn't granted it to this role, so a
 * user can't bypass the hidden sidebar link by just typing the URL.
 * Admin always passes through untouched.
 */
export default function PagePermissionRoute() {
  const location = useLocation();
  const { canView, loaded } = usePagePermissions();

  // Permissions haven't loaded yet (e.g. straight after login/refresh) —
  // render nothing for a moment rather than redirecting on a false negative.
  if (!loaded) return null;

  const perm = PAGE_PERMISSIONS[location.pathname];
  // '/' is always the redirect target below, so never redirect AWAY from
  // '/' itself even if 'View Dashboard' isn't granted — that would loop.
  if (perm && location.pathname !== '/' && !canView(perm.category, perm.name)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}