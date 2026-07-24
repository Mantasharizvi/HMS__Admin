const asyncHandler = require('../utils/asyncHandler');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const notify = require('../utils/notify');

/* -------------------- Patients -------------------- */

// @route   GET /api/opd/patients
const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().sort({ createdAt: -1 });
  res.json({ success: true, count: patients.length, data: patients });
});

// @route   POST /api/opd/patients
const registerPatient = asyncHandler(async (req, res) => {
  const { name, mobile, age, gender, department, doctor, complaint } = req.body;
  const patient = await Patient.create({
    name,
    mobile,
    age,
    gender,
    department,
    doctor: doctor || 'Unassigned',
    complaint,
    visitTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });
  res.status(201).json({ success: true, data: patient });
});

// @route   GET /api/opd/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, data: patient });
});

// @route   PUT /api/opd/patients/:id
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, data: patient });
});

// @route   DELETE /api/opd/patients/:id
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, message: 'Patient removed' });
});

/* -------------------- Appointments -------------------- */

// @route   GET /api/opd/appointments
const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });
  res.json({ success: true, count: appointments.length, data: appointments });
});

// @route   POST /api/opd/appointments
const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create(req.body);

  notify({
    type: 'info',
    title: 'New appointment booked',
    message: `${appointment.patient} booked with ${appointment.doctor} on ${appointment.date} at ${appointment.time}.`,
    category: 'appointments',
  }).catch(() => {});

  res.status(201).json({ success: true, data: appointment });
});

// @route   PUT /api/opd/appointments/:id
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  res.json({ success: true, data: appointment });
});

// @route   DELETE /api/opd/appointments/:id
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  res.json({ success: true, message: 'Appointment deleted' });
});

/* -------------------- Consultations / Prescriptions -------------------- */

// @route   GET /api/opd/consultations
const getConsultations = asyncHandler(async (req, res) => {
  const filter = req.query.patient ? { patient: req.query.patient } : {};
  const consultations = await Consultation.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: consultations.length, data: consultations });
});

// @route   POST /api/opd/consultations
const createConsultation = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.body.patient);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const consultation = await Consultation.create({
    ...req.body,
    patientCode: patient.patientCode,
  });

  // Auto-log this consultation into the patient's history so the
  // Patient History page reflects real, saved records from the DB.
  const prescribedNames = (req.body.prescriptions || []).map((p) => p.medicine).filter(Boolean);
  const noteText = req.body.notes?.trim()
    ? req.body.notes.trim()
    : prescribedNames.length
      ? `Prescribed: ${prescribedNames.join(', ')}`
      : 'Consultation recorded';

  patient.history.push({ note: noteText, date: new Date() });
  patient.status = 'Consulted';
  await patient.save();

  res.status(201).json({ success: true, data: consultation });
});

module.exports = {
  getPatients,
  registerPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getConsultations,
  createConsultation,
};
