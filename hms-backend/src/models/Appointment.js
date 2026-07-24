const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentCode: { type: String, unique: true }, // e.g. APT-201
    patient: { type: String, required: [true, 'Please select a patient'] },
    doctor: { type: String, required: [true, 'Please select a doctor'] },
    department: { type: String, default: '' },
    date: { type: String, required: [true, 'Date is required'] }, // stored as display string to mirror UI, e.g. "07 Jul 2026"
    time: { type: String, required: [true, 'Time slot is required'] },
    reason: { type: String, default: '' },
    type: { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    payment: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  },
  { timestamps: true }
);

appointmentSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.appointmentCode) {
    const seq = await nextSequence('appointment');
    this.appointmentCode = `APT-${200 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
