// Populates MongoDB with starter data that mirrors the frontend's mock data,
// so the UI looks familiar the moment you connect it to this backend.
//
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Ward = require('../models/Ward');
const Admission = require('../models/Admission');
const TreatmentRecord = require('../models/TreatmentRecord');
const Medicine = require('../models/Medicine');
const PurchaseEntry = require('../models/PurchaseEntry');
const Sale = require('../models/Sale');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');
const Bill = require('../models/Bill');
const { Counter } = require('./sequence');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany(),
    Patient.deleteMany(),
    Appointment.deleteMany(),
    Ward.deleteMany(),
    Admission.deleteMany(),
    TreatmentRecord.deleteMany(),
    Medicine.deleteMany(),
    PurchaseEntry.deleteMany(),
    Sale.deleteMany(),
    Role.deleteMany(),
    Permission.deleteMany(),
    Notification.deleteMany(),
    Bill.deleteMany(),
    Counter.deleteMany(),
  ]);

  console.log('Seeding users (demo login: admin@medicore.com / Admin@123)...');
  await User.create([
    { name: 'Dr. Rajesh Sharma', email: 'admin@medicore.com', password: 'Admin@123', role: 'Admin', department: 'Administration', phone: '9876500000', status: 'Active' },
    { name: 'Dr. Priya Nair', email: 'priya@medicore.com', password: 'Doctor@123', role: 'Doctor', department: 'Cardiology', phone: '9876500001', status: 'Active' },
    { name: 'Arjun Menon', email: 'arjun@medicore.com', password: 'Nurse@123', role: 'Nurse', department: 'ICU', phone: '9876500002', status: 'Active' },
    { name: 'Sneha Verma', email: 'sneha@medicore.com', password: 'Reception@123', role: 'Receptionist', department: 'Front Desk', phone: '9876500003', status: 'Inactive' },
  ]);

  console.log('Seeding OPD patients & appointments...');
  await Patient.create([
    { name: 'Aarav Sharma', age: 34, doctor: 'Dr. Nair', status: 'Consulted', visitTime: '09:30 AM', mobile: '9876511111', department: 'Cardiology' },
    { name: 'Meera Joseph', age: 28, doctor: 'Dr. Rao', status: 'Waiting', visitTime: '10:15 AM', mobile: '9876522222', department: 'ENT' },
    { name: 'Rahul Menon', age: 47, doctor: 'Dr. Shah', status: 'Pending Lab', visitTime: '11:00 AM', mobile: '9876533333', department: 'Orthopedic' },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  await Appointment.create([
    { patient: 'Sana Begum', doctor: 'Dr. Nair', department: 'Cardiology', date: today, time: '09:00 AM', status: 'Confirmed', payment: 'Paid', type: 'Offline' },
    { patient: 'Kiran Das', doctor: 'Dr. Rao', department: 'ENT', date: today, time: '10:30 AM', status: 'Pending', payment: 'Unpaid', type: 'Online' },
    { patient: 'Jaya Pillai', doctor: 'Dr. Shah', department: 'Orthopedic', date: today, time: '12:00 PM', status: 'Completed', payment: 'Paid', type: 'Offline' },
  ]);

  console.log('Seeding IPD wards, admissions & treatment records...');

  const makeBedList = (prefix, count, occupiedBeds = []) =>
    Array.from({ length: count }, (_, i) => {
      const bedNumber = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      return { bedNumber, status: occupiedBeds.includes(bedNumber) ? 'occupied' : 'vacant' };
    });

  await Ward.create([
    { name: 'ICU', beds: 12, occupied: 1, status: 'Critical Care', bedList: makeBedList('ICU', 12, ['ICU-02']) },
    { name: 'Ward A', beds: 24, occupied: 1, status: 'General Care', bedList: makeBedList('A', 24, ['A-14']) },
    { name: 'Ward B', beds: 18, occupied: 1, status: 'Maternity', bedList: makeBedList('B', 18, ['B-09']) },
  ]);

  await Admission.create([
    { patient: 'Ananya Roy', ward: 'ICU', bed: 'ICU-02', status: 'Admitted', admissionDate: '2026-07-05', contact: '9876544444' },
    { patient: 'Nikhil Rao', ward: 'Ward A', bed: 'A-14', status: 'Monitoring', admissionDate: '2026-07-04', contact: '9876555555' },
    { patient: 'Priya Kumar', ward: 'Ward B', bed: 'B-09', status: 'Recovery', admissionDate: '2026-07-03', contact: '9876566666' },
  ]);

  await TreatmentRecord.create([
    {
      patientId: 'IPD-401', name: 'IV Antibiotics Started', dateTime: '2026-07-07T09:30', doctor: 'Dr. Mehta',
      details: 'Administered IV ceftriaxone 1g for suspected infection.', medicinesGiven: 'Yes',
      vitals: 'BP 118/76, Pulse 82, Temp 99.1F, SpO2 97%', notes: 'Patient tolerated infusion well.',
      followUp: 'Repeat vitals in 6 hours.', status: 'Ongoing',
    },
  ]);

  console.log('Seeding pharmacy inventory, purchases & sales...');
  await Medicine.create([
    { name: 'Paracetamol 500mg', category: 'Analgesic', stock: 120, unit: 'Boxes', expiry: '2026-10-10' },
    { name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 48, unit: 'Boxes', expiry: '2026-08-15' },
    { name: 'Vitamin D3', category: 'Supplement', stock: 80, unit: 'Strip', expiry: '2027-01-22' },
  ]);

  await PurchaseEntry.create([
    { supplier: 'MediSupply Co.', medicine: 'Paracetamol', qty: 100, cost: 12500 },
    { supplier: 'LifeCare Pharma', medicine: 'Amoxicillin', qty: 60, cost: 18000 },
  ]);

  await Sale.create([
    { patient: 'Rahul Menon', medicine: 'Vitamin D3', qty: 10, amount: 1200 },
    { patient: 'Meera Joseph', medicine: 'Paracetamol', qty: 5, amount: 650 },
  ]);

  console.log('Seeding sample OPD/IPD bills for the revenue chart...');
  const thisYear = new Date().getFullYear();
  const monthsAgo = (n) => new Date(thisYear, new Date().getMonth() - n, 15);
  await Bill.create([
    { type: 'OPD', patient: 'Aarav Sharma', total: 1220, lineItems: [{ label: 'Consultation Fee', amount: 500 }, { label: 'Lab Charges', amount: 300 }, { label: 'Medicine Charges', amount: 420 }], createdAt: monthsAgo(2) },
    { type: 'OPD', patient: 'Meera Joseph', total: 820, lineItems: [{ label: 'Consultation Fee', amount: 500 }, { label: 'Medicine Charges', amount: 320 }], createdAt: monthsAgo(1) },
    { type: 'OPD', patient: 'Rahul Menon', total: 1500, lineItems: [{ label: 'Consultation Fee', amount: 500 }, { label: 'Lab Charges', amount: 600 }, { label: 'Medicine Charges', amount: 400 }], createdAt: monthsAgo(0) },
    { type: 'IPD', patient: 'Ananya Roy', total: 8200, lineItems: [{ label: 'Room Charges', amount: 4800 }, { label: 'Medicine & Supplies', amount: 2150 }, { label: 'Procedure Fee', amount: 1250 }], createdAt: monthsAgo(1) },
    { type: 'IPD', patient: 'Nikhil Rao', total: 6400, lineItems: [{ label: 'Room Charges', amount: 3600 }, { label: 'Medicine & Supplies', amount: 1800 }, { label: 'Procedure Fee', amount: 1000 }], createdAt: monthsAgo(0) },
  ]);

  console.log('Seeding roles & permissions...');
  await Role.create([
    { name: 'Admin', permissions: ['All'] },
    { name: 'Doctor', permissions: [] },
    { name: 'Nurse', permissions: [] },
    { name: 'Receptionist', permissions: [] },
    { name: 'Lab Technician', permissions: [] },
  ]);

  await Permission.create([
    // Dashboard
    { name: 'View Dashboard', category: 'Dashboard', enabled: true },

    // OPD
    { name: 'Patient Registration', category: 'OPD', enabled: true },
    { name: 'Appointment Management', category: 'OPD', enabled: true },
    { name: 'Doctor Consultation', category: 'OPD', enabled: false },
    { name: 'Prescription Page', category: 'OPD', enabled: false },
    { name: 'Billing and Invoice', category: 'OPD', enabled: false },
    { name: 'Patient History Section', category: 'OPD', enabled: false },

    // IPD
    { name: 'Admission Form', category: 'IPD', enabled: false },
    { name: 'Ward Management', category: 'IPD', enabled: false },
    { name: 'Bed Allocation', category: 'IPD', enabled: false },
    { name: 'Treatment Records', category: 'IPD', enabled: false },
    { name: 'Discharge Summary', category: 'IPD', enabled: false },
    { name: 'IPD Billing', category: 'IPD', enabled: false },

    // Pharmacy
    { name: 'Medicine Inventory', category: 'Pharmacy', enabled: false },
    { name: 'Purchase Entry', category: 'Pharmacy', enabled: false },
    { name: 'Sales Billing', category: 'Pharmacy', enabled: false },
    { name: 'Stock Management', category: 'Pharmacy', enabled: false },
    { name: 'Expiry Alerts', category: 'Pharmacy', enabled: false },
    { name: 'Pharmacy Reports', category: 'Pharmacy', enabled: false },

    // User Management
    { name: 'User List (Add User)', category: 'User Management', enabled: false },
    { name: 'Role Management', category: 'User Management', enabled: false },
    { name: 'Permissions Management', category: 'User Management', enabled: false },

    // Reports & Analytics
    { name: 'Analytics Dashboard', category: 'Reports & Analytics', enabled: false },
    { name: 'OPD Reports', category: 'Reports & Analytics', enabled: false },
    { name: 'IPD Reports', category: 'Reports & Analytics', enabled: false },
    { name: 'Pharmacy Reports (Analytics)', category: 'Reports & Analytics', enabled: false },
    { name: 'Revenue Reports', category: 'Reports & Analytics', enabled: false },

    // Settings
    { name: 'Manage Settings', category: 'Settings', enabled: false },
  ]);

  console.log('Seeding notifications...');
  await Notification.create([
    { type: 'warning', title: 'Low stock alert', message: 'Paracetamol 500mg is running low.' },
    { type: 'info', title: 'New appointment', message: 'Dr. Rao booked for 3:30 PM.' },
    { type: 'danger', title: 'Bed capacity', message: 'ICU is at 92% occupancy.' },
  ]);

  console.log('Seed complete.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
