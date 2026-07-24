// Single source of truth for which roles can access which module's API routes.
// To change access later, edit this map only — no route file needs to change.
//
// Requirement implemented here:
//   - Doctor, Nurse, Receptionist -> Ward Management (IPD) + Report Generation
//   - Pharmacist                 -> Pharmacy module ONLY
//   - Admin                      -> everything
const MODULE_PERMISSIONS = {
  dashboard: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist'],
  opd: ['Admin', 'Doctor', 'Nurse', 'Receptionist'],
  ipd: ['Admin', 'Doctor', 'Nurse', 'Receptionist'], // Ward Management module
  pharmacy: ['Admin', 'Pharmacist'],
  billing: ['Admin', 'Doctor', 'Nurse', 'Receptionist'],
  reports: ['Admin', 'Doctor', 'Nurse', 'Receptionist'], // Report generation
  users: ['Admin'],
  settings: ['Admin'],
};

module.exports = MODULE_PERMISSIONS;
