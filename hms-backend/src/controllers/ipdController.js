const asyncHandler = require('../utils/asyncHandler');
const Admission = require('../models/Admission');
const Ward = require('../models/Ward');
const TreatmentRecord = require('../models/TreatmentRecord');
const notify = require('../utils/notify');

/* -------------------- Wards -------------------- */

// @route   GET /api/ipd/wards
const getWards = asyncHandler(async (req, res) => {
  const wards = await Ward.find().sort({ name: 1 });
  res.json({ success: true, count: wards.length, data: wards });
});

// @route   POST /api/ipd/wards
// @route   POST /api/ipd/wards
const createWard = asyncHandler(async (req, res) => {
  const ward = await Ward.create(req.body);
  res.status(201).json({ success: true, data: ward });
});

// @route   POST /api/ipd/wards/:wardId/beds
// @desc    Add one or more new beds to an existing ward.
//          Body: { count: 3 } -> auto-numbered, or { bedNumbers: ["ICU-13", ...] }
const addBedsToWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findById(req.params.wardId);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  let newBedNumbers = [];
  if (Array.isArray(req.body.bedNumbers) && req.body.bedNumbers.length > 0) {
    newBedNumbers = req.body.bedNumbers.map((b) => String(b).trim()).filter(Boolean);
  } else {
    const count = Number(req.body.count) || 0;
    if (count < 1) {
      res.status(400);
      throw new Error('Provide a count of at least 1, or a list of bed numbers');
    }
    const prefix = ward.name.replace(/\s+/g, '').slice(0, 4).toUpperCase();
    const existingNumbers = ward.bedList
      .map((b) => parseInt(String(b.bedNumber).split('-').pop(), 10))
      .filter((n) => !Number.isNaN(n));
    let nextIndex = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : ward.bedList.length + 1;
    for (let i = 0; i < count; i += 1) {
      newBedNumbers.push(`${prefix}-${String(nextIndex).padStart(2, '0')}`);
      nextIndex += 1;
    }
  }

  const existingSet = new Set(ward.bedList.map((b) => b.bedNumber.toLowerCase()));
  const duplicate = newBedNumbers.find((b) => existingSet.has(b.toLowerCase()));
  if (duplicate) {
    res.status(400);
    throw new Error(`Bed "${duplicate}" already exists in ${ward.name}`);
  }

  newBedNumbers.forEach((bedNumber) => {
    ward.bedList.push({ bedNumber, status: 'vacant' });
  });
  ward.beds = ward.bedList.length;
  ward.occupied = ward.bedList.filter((b) => b.status === 'occupied').length;
  await ward.save();

  res.status(201).json({ success: true, data: ward });
});



/* -------------------- Admissions -------------------- */

// @route   GET /api/ipd/admissions
const getAdmissions = asyncHandler(async (req, res) => {
  const admissions = await Admission.find().sort({ createdAt: -1 });
  res.json({ success: true, count: admissions.length, data: admissions });
});

// @route   POST /api/ipd/admissions
const admitPatient = asyncHandler(async (req, res) => {
  const admission = await Admission.create({ ...req.body, status: 'Admitted' });

  // Mark the matching bed as occupied (adding it to the bedList if it
  // wasn't already there), and keep the occupied counter consistent.
  const ward = await Ward.findOne({ name: admission.ward });
  if (ward) {
    let bed = ward.bedList.find((b) => b.bedNumber === admission.bed);
    if (!bed) {
      ward.bedList.push({ bedNumber: admission.bed, status: 'occupied' });
    } else {
      bed.status = 'occupied';
    }
    ward.occupied = Math.min(ward.beds, ward.bedList.filter((b) => b.status === 'occupied').length);
    await ward.save();
  }

  notify({
    type: 'warning',
    title: 'New inpatient admission',
    message: `${admission.patient} admitted to ${admission.ward} (bed ${admission.bed}).`,
    category: 'critical',
  }).catch(() => {});

  res.status(201).json({ success: true, data: admission });
});

// @route   PUT /api/ipd/admissions/:id
const updateAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }
  res.json({ success: true, data: admission });
});

// @route   POST /api/ipd/admissions/:id/discharge
const dischargePatient = asyncHandler(async (req, res) => {
  const { dischargeDate, condition, summaryNotes } = req.body;

  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    res.status(404);
    throw new Error('Please select a valid admission profile');
  }

  admission.status = 'Discharged';
  admission.dischargeDate = dischargeDate;
  admission.dischargeCondition = condition || 'Stable';
  admission.dischargeSummary = summaryNotes || '';
  await admission.save();

  // Free up the bed in that ward
  const ward = await Ward.findOne({ name: admission.ward });
  if (ward) {
    const bed = ward.bedList.find((b) => b.bedNumber === admission.bed);
    if (bed) bed.status = 'vacant';
    ward.occupied = Math.max(0, ward.bedList.filter((b) => b.status === 'occupied').length);
    await ward.save();
  }

  notify({
    type: 'success',
    title: 'Inpatient discharged',
    message: `${admission.patient} discharged from ${admission.ward} (bed ${admission.bed}). Bed is now vacant.`,
    category: 'critical',
  }).catch(() => {});

  res.json({ success: true, data: admission });
});

// @route   PUT /api/ipd/wards/:wardId/beds/:bedNumber
// @desc    Manually edit a single bed's status (vacant/reserved/cleaning).
//          Occupied is normally set automatically via admission, but an
//          admin can still correct it here if needed.
const updateBedStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['vacant', 'occupied', 'reserved', 'cleaning'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(', ')}`);
  }

  const ward = await Ward.findById(req.params.wardId);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  const bed = ward.bedList.find((b) => b.bedNumber === req.params.bedNumber);
  if (!bed) {
    res.status(404);
    throw new Error('Bed not found in this ward');
  }

  bed.status = status;
  ward.occupied = Math.max(0, ward.bedList.filter((b) => b.status === 'occupied').length);
  await ward.save();

  res.json({ success: true, data: ward });
});

/* -------------------- Treatment records -------------------- */

// @route   GET /api/ipd/treatments
const getTreatmentRecords = asyncHandler(async (req, res) => {
  const filter = req.query.patientId ? { patientId: req.query.patientId } : {};
  const records = await TreatmentRecord.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: records.length, data: records });
});

// @route   POST /api/ipd/treatments
const addTreatmentRecord = asyncHandler(async (req, res) => {
  const record = await TreatmentRecord.create(req.body);
  res.status(201).json({ success: true, data: record });
});

module.exports = {
  getWards,
  createWard,
  addBedsToWard,
  updateBedStatus,
  getAdmissions,
  admitPatient,
  updateAdmission,
  dischargePatient,
  getTreatmentRecords,
  addTreatmentRecord,
};
