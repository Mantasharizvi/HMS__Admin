const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const patientSchema = new mongoose.Schema(
  {
    patientCode: { type: String, unique: true }, // e.g. OPD-101
    name: { type: String, required: [true, 'Patient name is required'], trim: true },
    mobile: { type: String, required: [true, 'Mobile number is required'] },
    age: { type: Number, required: [true, 'Age is required'] },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    department: { type: String, default: '' },
    doctor: { type: String, default: 'Unassigned' },
    complaint: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Waiting', 'Consulted', 'Pending Lab'],
      default: 'Waiting',
    },
    visitTime: { type: String, default: '' }, // display string e.g. "09:30 AM"

    // Patient history (auto-logged from each saved consultation)
    history: [
      {
        note: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

patientSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.patientCode) {
    const seq = await nextSequence('patient');
    this.patientCode = `OPD-${100 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
