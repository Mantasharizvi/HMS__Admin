const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const Bill = require('../models/Bill');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Ward = require('../models/Ward');

const DAYS_IN_REPORT = 7;

// Builds the last N calendar days (oldest first), each as a [start, end)
// UTC window plus a display label like "07 Jul 2026" for the table row.
function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - i);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const label = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    days.push({ start, end, label });
  }
  return days;
}

// @desc    Daily OPD report for the last 7 days — real appointment + billing data
// @route   GET /api/reports/opd
const getOpdReport = asyncHandler(async (req, res) => {
  const days = lastNDays(DAYS_IN_REPORT);

  const rows = await Promise.all(
    days.map(async (day, idx) => {
      const [patients, consultations, revenueAgg] = await Promise.all([
        Appointment.countDocuments({ createdAt: { $gte: day.start, $lt: day.end } }),
        Appointment.countDocuments({ createdAt: { $gte: day.start, $lt: day.end }, status: 'Completed' }),
        Bill.aggregate([
          { $match: { type: 'OPD', createdAt: { $gte: day.start, $lt: day.end } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);
      return {
        id: `OPD-${String(idx + 1).padStart(3, '0')}`,
        date: day.label,
        patients,
        consultations,
        revenue: revenueAgg[0]?.total || 0,
      };
    })
  );

  res.json({ success: true, data: rows.reverse() }); // most recent day first
});

// @desc    Daily IPD report for the last 7 days — real admission + billing data.
//          Bed occupancy isn't tracked historically (only a live snapshot
//          exists), so it's only shown for today's row; older rows show "—".
// @route   GET /api/reports/ipd
const getIpdReport = asyncHandler(async (req, res) => {
  const days = lastNDays(DAYS_IN_REPORT);

  const wards = await Ward.find();
  const totalBeds = wards.reduce((sum, w) => sum + w.beds, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.occupied, 0);
  const liveOccupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const rows = await Promise.all(
    days.map(async (day, idx) => {
      const [admissions, discharges, revenueAgg] = await Promise.all([
        Admission.countDocuments({ createdAt: { $gte: day.start, $lt: day.end } }),
        Admission.countDocuments({ status: 'Discharged', updatedAt: { $gte: day.start, $lt: day.end } }),
        Bill.aggregate([
          { $match: { type: 'IPD', createdAt: { $gte: day.start, $lt: day.end } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);
      const isToday = idx === days.length - 1;
      return {
        id: `IPD-${String(idx + 1).padStart(3, '0')}`,
        date: day.label,
        admissions,
        discharges,
        occupancy: isToday ? `${liveOccupancyPct}%` : '—',
        revenue: revenueAgg[0]?.total || 0,
      };
    })
  );

  res.json({ success: true, data: rows.reverse() });
});

// @desc    Daily Pharmacy report for the last 7 days — real sales data.
//          "stock" shows the CURRENT stock level of that day's top-selling
//          medicine (stock isn't tracked historically, only live).
// @route   GET /api/reports/pharmacy
const getPharmacyReport = asyncHandler(async (req, res) => {
  const days = lastNDays(DAYS_IN_REPORT);

  const rows = await Promise.all(
    days.map(async (day, idx) => {
      const [salesAgg, topMedicineAgg] = await Promise.all([
        Sale.aggregate([
          { $match: { createdAt: { $gte: day.start, $lt: day.end } } },
          { $group: { _id: null, itemsSold: { $sum: '$qty' }, revenue: { $sum: '$amount' } } },
        ]),
        Sale.aggregate([
          { $match: { createdAt: { $gte: day.start, $lt: day.end } } },
          { $group: { _id: '$medicine', qty: { $sum: '$qty' } } },
          { $sort: { qty: -1 } },
          { $limit: 1 },
        ]),
      ]);

      const topMedicineName = topMedicineAgg[0]?._id || '—';
      let stock = '—';
      if (topMedicineName !== '—') {
        const med = await Medicine.findOne({ name: topMedicineName });
        if (med) stock = med.stock;
      }

      return {
        id: `PHR-${String(idx + 1).padStart(3, '0')}`,
        date: day.label,
        itemsSold: salesAgg[0]?.itemsSold || 0,
        revenue: salesAgg[0]?.revenue || 0,
        topMedicine: topMedicineName,
        stock,
      };
    })
  );

  res.json({ success: true, data: rows.reverse() });
});

// @desc    Consolidated all-time revenue by source, with a month-over-month
//          trend arrow, computed from real billing/sales records.
// @route   GET /api/reports/revenue
const getRevenueReport = asyncHandler(async (req, res) => {
  const [opdAgg, ipdAgg, pharmacyAgg] = await Promise.all([
    Bill.aggregate([{ $match: { type: 'OPD' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Bill.aggregate([{ $match: { type: 'IPD' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Sale.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const trendFor = async (Model, match, field) => {
    const [thisMonth, lastMonth] = await Promise.all([
      Model.aggregate([
        { $match: { ...match, createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: `$${field}` } } },
      ]),
      Model.aggregate([
        { $match: { ...match, createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: `$${field}` } } },
      ]),
    ]);
    return (thisMonth[0]?.total || 0) >= (lastMonth[0]?.total || 0) ? 'up' : 'down';
  };

  const [opdTrend, ipdTrend, pharmacyTrend] = await Promise.all([
    trendFor(Bill, { type: 'OPD' }, 'total'),
    trendFor(Bill, { type: 'IPD' }, 'total'),
    trendFor(Sale, {}, 'amount'),
  ]);

  const opdTotal = opdAgg[0]?.total || 0;
  const ipdTotal = ipdAgg[0]?.total || 0;
  const pharmacyTotal = pharmacyAgg[0]?.total || 0;
  const grandTotal = opdTotal + ipdTotal + pharmacyTotal;
  const pct = (v) => (grandTotal ? `${Math.round((v / grandTotal) * 100)}%` : '0%');

  res.json({
    success: true,
    data: [
      { id: 'REV-001', source: 'OPD Consultations', amount: opdTotal, percentage: pct(opdTotal), trend: opdTrend },
      { id: 'REV-002', source: 'IPD Services', amount: ipdTotal, percentage: pct(ipdTotal), trend: ipdTrend },
      { id: 'REV-003', source: 'Pharmacy Sales', amount: pharmacyTotal, percentage: pct(pharmacyTotal), trend: pharmacyTrend },
    ],
  });
});

module.exports = { getOpdReport, getIpdReport, getPharmacyReport, getRevenueReport };
