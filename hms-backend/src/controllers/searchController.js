const asyncHandler = require('../utils/asyncHandler');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');

const MAX_PER_CATEGORY = 5;

// Escapes regex special characters so a query like "Dr. Sen" or "3+1"
// doesn't break the RegExp constructor.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// @desc    Global header search across patients, doctors, appointments,
//          medicines and bills — real DB data, no mocks.
// @route   GET /api/search?q=...
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: true, results: [] });

  const regex = new RegExp(escapeRegex(q), 'i'); // case-insensitive partial match

  const [patients, doctors, appointments, medicines, bills] = await Promise.all([
    Patient.find({ $or: [{ name: regex }, { mobile: regex }, { patientCode: regex }] }).limit(MAX_PER_CATEGORY),
    User.find({ role: 'Doctor', name: regex }).limit(MAX_PER_CATEGORY),
    Appointment.find({ $or: [{ patient: regex }, { doctor: regex }, { appointmentCode: regex }] }).limit(MAX_PER_CATEGORY),
    Medicine.find({ $or: [{ name: regex }, { medicineCode: regex }] }).limit(MAX_PER_CATEGORY),
    Bill.find({ $or: [{ patient: regex }, { billCode: regex }] }).limit(MAX_PER_CATEGORY),
  ]);

  const results = [
    ...patients.map((p) => ({
      id: p.patientCode || p._id.toString(),
      category: 'patients',
      title: p.name,
      subtitle: `${p.department || 'General'} · ${p.status} · Dr. ${p.doctor}`,
    })),
    ...doctors.map((d) => ({
      id: d._id.toString(),
      category: 'doctors',
      title: d.name,
      subtitle: d.department || 'Doctor',
    })),
    ...appointments.map((a) => ({
      id: a.appointmentCode || a._id.toString(),
      category: 'appointments',
      title: `${a.patient} — ${a.doctor}`,
      subtitle: `${a.date} · ${a.time}`,
    })),
    ...medicines.map((m) => ({
      id: m.medicineCode || m._id.toString(),
      category: 'medicines',
      title: m.name,
      subtitle: `Stock: ${m.stock} ${m.unit}`,
    })),
    ...bills.map((b) => ({
      id: b.billCode || b._id.toString(),
      category: 'billing',
      title: `${b.patient} invoice`,
      subtitle: `${b.type} · ₹${b.total}`,
    })),
  ];

  res.json({ success: true, results });
});

module.exports = { globalSearch };
