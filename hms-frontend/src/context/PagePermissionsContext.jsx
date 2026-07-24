import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PagePermissionsContext = createContext(null);

/**
 * Fetches which pages the logged-in user's role has been granted by Admin
 * (via Settings/User Management > Permissions Management) and exposes a
 * canView(category, name) check the Sidebar uses to only show those pages.
 * Applies to every non-admin role — Doctor, Nurse, Receptionist, Pharmacist,
 * Lab Technician. Admin always sees everything.
 */
export function PagePermissionsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [grantedKeys, setGrantedKeys] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      setGrantedKeys(new Set());
      setLoaded(true);
      return;
    }
    api
      .get('/users/my-permissions')
      .then(({ data }) => {
        setIsAdmin(!!data.isAdmin);
        setGrantedKeys(new Set((data.permissions || []).map((p) => `${p.category}::${p.name}`)));
      })
      .catch(() => {
        // Fail closed: if we can't confirm what's granted, don't show extra pages.
        setIsAdmin(false);
        setGrantedKeys(new Set());
      })
      .finally(() => setLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    load();
    // Re-check whenever login state or the user's role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const canView = useCallback(
    (category, name) => isAdmin || grantedKeys.has(`${category}::${name}`),
    [isAdmin, grantedKeys]
  );

  const value = { isAdmin, canView, loaded, refresh: load };

  return <PagePermissionsContext.Provider value={value}>{children}</PagePermissionsContext.Provider>;
}

export function usePagePermissions() {
  const ctx = useContext(PagePermissionsContext);
  if (!ctx) throw new Error('usePagePermissions must be used within a PagePermissionsProvider');
  return ctx;
}
