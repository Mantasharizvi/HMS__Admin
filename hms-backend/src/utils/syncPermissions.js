// Safely adds the full set of module/page permissions to an EXISTING database
// without deleting users, patients, roles, or any other data.
// Existing permissions (and their enabled/role assignments) are left untouched;
// only permissions that don't already exist (matched by name + category) are
// inserted.
//
// Run with: npm run sync-permissions
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Permission = require('../models/Permission');

const FULL_PERMISSIONS = [
  // Dashboard
  { name: 'View Dashboard', category: 'Dashboard' },

  // OPD
  { name: 'Patient Registration', category: 'OPD' },
  { name: 'Appointment Management', category: 'OPD' },
  { name: 'Doctor Consultation', category: 'OPD' },
  { name: 'Prescription Page', category: 'OPD' },
  { name: 'Billing and Invoice', category: 'OPD' },
  { name: 'Patient History Section', category: 'OPD' },

  // IPD
  { name: 'Admission Form', category: 'IPD' },
  { name: 'Ward Management', category: 'IPD' },
  { name: 'Bed Allocation', category: 'IPD' },
  { name: 'Treatment Records', category: 'IPD' },
  { name: 'Discharge Summary', category: 'IPD' },
  { name: 'IPD Billing', category: 'IPD' },

  // Pharmacy
  { name: 'Medicine Inventory', category: 'Pharmacy' },
  { name: 'Purchase Entry', category: 'Pharmacy' },
  { name: 'Sales Billing', category: 'Pharmacy' },
  { name: 'Stock Management', category: 'Pharmacy' },
  { name: 'Expiry Alerts', category: 'Pharmacy' },
  { name: 'Pharmacy Reports', category: 'Pharmacy' },

  // User Management
  { name: 'User List (Add User)', category: 'User Management' },
  { name: 'Role Management', category: 'User Management' },
  { name: 'Permissions Management', category: 'User Management' },

  // Reports & Analytics
  { name: 'Analytics Dashboard', category: 'Reports & Analytics' },
  { name: 'OPD Reports', category: 'Reports & Analytics' },
  { name: 'IPD Reports', category: 'Reports & Analytics' },
  { name: 'Pharmacy Reports (Analytics)', category: 'Reports & Analytics' },
  { name: 'Revenue Reports', category: 'Reports & Analytics' },

  // Settings
  { name: 'Manage Settings', category: 'Settings' },
];

const run = async () => {
  await connectDB();

  const existing = await Permission.find().select('name category');
  const existingKeys = new Set(existing.map((p) => `${p.category}::${p.name}`));

  const toInsert = FULL_PERMISSIONS.filter(
    (p) => !existingKeys.has(`${p.category}::${p.name}`)
  ).map((p) => ({ ...p, enabled: false }));

  if (toInsert.length === 0) {
    console.log('Nothing to do — every module/page permission already exists.');
  } else {
    await Permission.insertMany(toInsert);
    console.log(`Added ${toInsert.length} new permission(s):`);
    toInsert.forEach((p) => console.log(`  - [${p.category}] ${p.name}`));
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to sync permissions:', err);
  process.exit(1);
});
