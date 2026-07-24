import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, BedDouble,
  Pill, Settings, X, Activity, BarChart3, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePagePermissions } from '../../context/PagePermissionsContext';
import { canAccessModule, PAGE_PERMISSIONS } from '../../utils/modulePermissions';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, module: 'dashboard' },
  {
    label: 'OPD', icon: ClipboardList, base: '/opd', module: 'opd',
    children: [
      { to: '/opd/patients', label: 'Patient Registration' },
      { to: '/opd/appointments', label: 'Appointment Management' },
      { to: '/opd/consultation', label: 'Doctor Consultation' },
      { to: '/opd/prescriptions', label: 'Prescription Page' },
      { to: '/opd/billing', label: 'Billing and Invoice' },
      { to: '/opd/history', label: 'Patient History Section' },
    ],
  },
  {
    label: 'IPD', icon: BedDouble, base: '/ipd', module: 'ipd',
    children: [
      { to: '/ipd/admission', label: 'Admission Form' },
      { to: '/ipd/wards', label: 'Ward Management' },
      { to: '/ipd/beds', label: 'Bed Allocation' },
      { to: '/ipd/treatments', label: 'Treatment Records' },
      { to: '/ipd/discharge', label: 'Discharge Summary' },
      { to: '/ipd/billing', label: 'IPD Billing' },
    ],
  },
  {
    label: 'Pharmacy', icon: Pill, base: '/pharmacy', module: 'pharmacy',
    children: [
      { to: '/pharmacy/inventory', label: 'Medicine Inventory' },
      { to: '/pharmacy/purchase', label: 'Purchase Entry' },
      { to: '/pharmacy/sales', label: 'Sales Billing' },
      { to: '/pharmacy/stock', label: 'Stock Management' },
      { to: '/pharmacy/expiry', label: 'Expiry Alerts' },
      { to: '/pharmacy/reports', label: 'Pharmacy Reports' },
    ],
  },
  {
    label: 'User Management', icon: Users, base: '/users', module: 'users',
    children: [
      { to: '/users/list', label: 'User List (Add User)' },
      { to: '/users/roles', label: 'Role Management' },
      { to: '/users/permissions', label: 'Permissions Management' },
    ],
  },
  {
    label: 'Reports & Analytics', icon: BarChart3, base: '/reports', module: 'reports',
    children: [
      { to: '/reports/dashboard', label: 'Analytics Dashboard' },
      { to: '/reports/opd', label: 'OPD Reports' },
      { to: '/reports/ipd', label: 'IPD Reports' },
      { to: '/reports/pharmacy', label: 'Pharmacy Reports' },
      { to: '/reports/revenue', label: 'Revenue Reports' },
    ],
  },
  { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const { canView } = usePagePermissions();

  // First narrow by the static module-level role check (unchanged), then
  // narrow further to only the specific pages Admin has switched on for
  // this role via Permissions Management. Admin itself always sees
  // everything; every other role (Doctor, Nurse, Receptionist, Pharmacist,
  // Lab Technician) only sees pages explicitly granted to their role.
  const visibleNavItems = navItems
    .filter((item) => canAccessModule(user?.role, item.module))
    .map((item) => {
      if (!item.children) return item;
      const visibleChildren = item.children.filter((child) => {
        const perm = PAGE_PERMISSIONS[child.to];
        return !perm || canView(perm.category, perm.name);
      });
      return { ...item, children: visibleChildren };
    })
    .filter((item) => {
      if (!item.children) {
        const perm = PAGE_PERMISSIONS[item.to];
        return !perm || canView(perm.category, perm.name);
      }
      // Hide the whole dropdown module if none of its pages are granted.
      return item.children.length > 0;
    });

  const [openModule, setOpenModule] = useState(() => {
    const active = visibleNavItems.find((item) => item.base && location.pathname.startsWith(item.base));
    return active?.label ?? null;
  });

  // Keep the dropdown open when navigating directly (e.g. refresh, back button)
  // to a child route of a different module.
  useEffect(() => {
    const active = visibleNavItems.find((item) => item.base && location.pathname.startsWith(item.base));
    if (active) setOpenModule(active.label);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleModule = (label) => {
    setOpenModule((current) => (current === label ? null : label));
  };

  return (
    <>
      {/* mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0
          bg-navy-900 text-white flex flex-col
          transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-semibold tracking-tight">MediCore HMS</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            // Flat link (Dashboard, Settings)
            if (!item.children) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isActive ? 'bg-teal-600 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {item.label}
                </NavLink>
              );
            }

            // Dropdown module (OPD, IPD, Pharmacy, User Management, Reports & Analytics)
            const isModuleActive = location.pathname.startsWith(item.base);
            const isOpenModule = openModule === item.label;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleModule(item.label)}
                  aria-expanded={isOpenModule}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isModuleActive ? 'text-white bg-white/5' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-150 ${isOpenModule ? 'rotate-180' : ''}`} />
                </button>

                {isOpenModule && (
                  <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onClose}
                        className={({ isActive }) => `
                          block px-3 py-2 rounded-lg text-sm
                          transition-colors duration-150
                          ${isActive ? 'bg-teal-600 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                        `}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
