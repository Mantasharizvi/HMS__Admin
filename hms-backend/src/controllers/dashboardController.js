const HospitalSettings = require('../models/HospitalSettings');
const asyncHandler = require('../utils/asyncHandler');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const Ward = require('../models/Ward');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');
const Bill = require('../models/Bill');
const Sale = require('../models/Sale');

// Admission.status -> badge tone used by the "Recently Admitted" widget.
const conditionTone = { Admitted: 'warning', Monitoring: 'warning', Recovery: 'success', Discharged: 'success' };

// @desc    Top stat cards - total patients, occupied beds, today's appointments, pending bills
// @route   GET /api/dashboard/stats
const getStats = asyncHandler(async (req, res) => {
  const [totalPatients, todayAppointments, wards, unpaidAppointments] = await Promise.all([
    Patient.countDocuments(),
    Appointment.countDocuments({ date: new Date().toISOString().slice(0, 10) }),
    Ward.find(),
    Appointment.countDocuments({ payment: 'Unpaid' }),
  ]);

  const totalBeds = wards.reduce((sum, w) => sum + w.beds, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.occupied, 0);

  res.json({
    success: true,
    data: {
      totalPatients,
      occupiedBeds,
      totalBeds,
      todayAppointments,
      pendingBillsCount: unpaidAppointments,
    },
  });
});

// @desc    Revenue chart series by month (OPD/IPD/Pharmacy), always Jan-Dec
//          for the current year, computed from real billing records
// @route   GET /api/dashboard/revenue-chart
const getRevenueChart = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const [opdAgg, ipdAgg, pharmacyAgg] = await Promise.all([
    Bill.aggregate([
      { $match: { type: 'OPD', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$total' } } },
    ]),
    Bill.aggregate([
      { $match: { type: 'IPD', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$total' } } },
    ]),
    Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Mongo's $month is 1-indexed (Jan = 1); fill every month so the chart
  // always spans the full year even where a month has no billing yet.
  const toMonthArray = (agg) => {
    const byMonth = new Map(agg.map((a) => [a._id, a.total]));
    return monthLabels.map((_, i) => byMonth.get(i + 1) || 0);
  };

  res.json({
    success: true,
    data: {
      labels: monthLabels,
      opd: toMonthArray(opdAgg),
      ipd: toMonthArray(ipdAgg),
      pharmacy: toMonthArray(pharmacyAgg),
    },
  });
});

// @desc    Appointment status breakdown for the donut chart
// @route   GET /api/dashboard/appointment-status
const getAppointmentStatusChart = asyncHandler(async (req, res) => {
  const breakdown = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: breakdown });
});

// @desc    Department patient load
// @route   GET /api/dashboard/department-load
// OLD - delete this
// NEW - use this instead
const getDepartmentLoad = asyncHandler(async (req, res) => {
  const settings = await HospitalSettings.findOne();
  const registeredDepartments = settings?.departments?.length
    ? settings.departments
    : (await Patient.distinct('department')).filter(Boolean);

  const breakdown = await Patient.aggregate([
    { $match: { department: { $in: registeredDepartments } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countByDept = new Map(breakdown.map((b) => [b._id, b.count]));

  const data = registeredDepartments.map((dept) => ({
    _id: dept,
    count: countByDept.get(dept) || 0,
  }));

  res.json({ success: true, data });
});
// @desc    Recently admitted inpatients - feeds the Dashboard's "Recently
//          Admitted" table (patient, doctor, ward/bed, date, condition)
// @route   GET /api/dashboard/recent-patients
const getRecentPatients = asyncHandler(async (req, res) => {
  const admissions = await Admission.find().sort({ createdAt: -1 }).limit(20);
  const data = admissions.map((a) => ({
    id: a.id,
    name: a.patient,
    doctor: a.doctor || 'Unassigned',
    department: a.ward,
    ward: `${a.ward} - ${a.bed}`,
    date: a.admissionDate,
    status: conditionTone[a.status] || 'success',
  }));
  res.json({ success: true, data });
});

// @desc    Notifications feed
// @route   GET /api/dashboard/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, data: notifications });
});

// @desc    Upcoming appointments + expiring medicines widgets
// @route   GET /api/dashboard/quick-widgets
const getQuickWidgets = asyncHandler(async (req, res) => {
  const upcomingAppointments = await Appointment.find({ status: { $in: ['Pending', 'Confirmed'] } })
    .sort({ createdAt: -1 })
    .limit(5);

  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const expiringMedicines = await Medicine.find({ expiry: { $lte: soon.toISOString().slice(0, 10) } }).limit(5);

  res.json({ success: true, data: { upcomingAppointments, expiringMedicines } });
});

// @desc    Revenue split by service source (OPD / IPD / Pharmacy) — feeds
//          the Service Distribution donut chart on the Analytics Dashboard.
//          Computed from real billing records, all-time totals.
// @route   GET /api/dashboard/service-distribution
const getServiceDistribution = asyncHandler(async (req, res) => {
  const [opdAgg, ipdAgg, pharmacyAgg] = await Promise.all([
    Bill.aggregate([
      { $match: { type: 'OPD' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Bill.aggregate([
      { $match: { type: 'IPD' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: [
      { label: 'OPD Consultations', value: opdAgg[0]?.total || 0, color: '#14899E' },
      { label: 'IPD Services', value: ipdAgg[0]?.total || 0, color: '#0B5566' },
      { label: 'Pharmacy Sales', value: pharmacyAgg[0]?.total || 0, color: '#B87A17' },
    ],
  });
});

module.exports = {
  getStats,
  getRevenueChart,
  getAppointmentStatusChart,
  getDepartmentLoad,
  getRecentPatients,
  getNotifications,
  getQuickWidgets,
  getServiceDistribution,
};
