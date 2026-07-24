// Single source of truth for which roles can see/use which module in the UI.
// Keep this in sync with hms-backend/src/config/modulePermissions.js —
// the backend is what actually enforces access; this file just makes the
// UI (sidebar + routes) match it so users aren't shown links they can't use.
export const MODULE_ACCESS = {
  dashboard: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist'],
  opd: ['Admin', 'Doctor', 'Nurse', 'Receptionist'],
  ipd: ['Admin', 'Doctor', 'Nurse', 'Receptionist'], // Ward Management module
  pharmacy: ['Admin', 'Pharmacist'],
  reports: ['Admin', 'Doctor', 'Nurse', 'Receptionist'], // Report generation
  users: ['Admin'],
  settings: ['Admin'],
};

/**
 * Returns true if the given role can access the given module.
 * A module key not present in MODULE_ACCESS fails OPEN (treated as
 * unrestricted) so unrelated/utility routes aren't accidentally locked out.
 */
export function canAccessModule(role, moduleKey) {
  const allowedRoles = MODULE_ACCESS[moduleKey];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

// Maps each sidebar route to the exact { category, name } permission that
// Admin grants/revokes on the Permissions Management page. Keep the
// name/category values in sync with hms-backend/src/utils/seed.js and
// syncPermissions.js — the Sidebar uses this to only show links Admin has
// actually switched on for the logged-in user's role.
export const PAGE_PERMISSIONS = {
  '/': { category: 'Dashboard', name: 'View Dashboard' },

  '/opd/patients': { category: 'OPD', name: 'Patient Registration' },
  '/opd/appointments': { category: 'OPD', name: 'Appointment Management' },
  '/opd/consultation': { category: 'OPD', name: 'Doctor Consultation' },
  '/opd/prescriptions': { category: 'OPD', name: 'Prescription Page' },
  '/opd/billing': { category: 'OPD', name: 'Billing and Invoice' },
  '/opd/history': { category: 'OPD', name: 'Patient History Section' },

  '/ipd/admission': { category: 'IPD', name: 'Admission Form' },
  '/ipd/wards': { category: 'IPD', name: 'Ward Management' },
  '/ipd/beds': { category: 'IPD', name: 'Bed Allocation' },
  '/ipd/treatments': { category: 'IPD', name: 'Treatment Records' },
  '/ipd/discharge': { category: 'IPD', name: 'Discharge Summary' },
  '/ipd/billing': { category: 'IPD', name: 'IPD Billing' },

  '/pharmacy/inventory': { category: 'Pharmacy', name: 'Medicine Inventory' },
  '/pharmacy/purchase': { category: 'Pharmacy', name: 'Purchase Entry' },
  '/pharmacy/sales': { category: 'Pharmacy', name: 'Sales Billing' },
  '/pharmacy/stock': { category: 'Pharmacy', name: 'Stock Management' },
  '/pharmacy/expiry': { category: 'Pharmacy', name: 'Expiry Alerts' },
  '/pharmacy/reports': { category: 'Pharmacy', name: 'Pharmacy Reports' },

  '/users/list': { category: 'User Management', name: 'User List (Add User)' },
  '/users/roles': { category: 'User Management', name: 'Role Management' },
  '/users/permissions': { category: 'User Management', name: 'Permissions Management' },

  '/reports/dashboard': { category: 'Reports & Analytics', name: 'Analytics Dashboard' },
  '/reports/opd': { category: 'Reports & Analytics', name: 'OPD Reports' },
  '/reports/ipd': { category: 'Reports & Analytics', name: 'IPD Reports' },
  '/reports/pharmacy': { category: 'Reports & Analytics', name: 'Pharmacy Reports (Analytics)' },
  '/reports/revenue': { category: 'Reports & Analytics', name: 'Revenue Reports' },

  '/settings': { category: 'Settings', name: 'Manage Settings' },
};
