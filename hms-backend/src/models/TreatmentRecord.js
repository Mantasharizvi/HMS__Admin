const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const treatmentRecordSchema = new mongoose.Schema(
  {
    treatmentCode: { type: String, unique: true }, // e.g. TRT-501
    patientId: { type: String, required: [true, 'Patient ID is required'] }, // admissionCode reference, e.g. IPD-401
    name: { type: String, required: [true, 'Treatment/Procedure name is required'] },
    dateTime: { type: String, required: [true, 'Date and time is required'] },
    doctor: { type: String, required: [true, 'Attending doctor is required'] },
    details: { type: String, default: '' },
    medicinesGiven: { type: String, enum: ['Yes', 'No'], default: 'No' },
    vitals: { type: String, default: '' },
    notes: { type: String, default: '' },
    followUp: { type: String, default: '' },
    status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
    medicineSuppliesCost: { type: Number, default: 0 },
    procedureFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

treatmentRecordSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.treatmentCode) {
    const seq = await nextSequence('treatment');
    this.treatmentCode = `TRT-${500 + seq}`;
  }
  next();
});

module.exports = mongoose.model('TreatmentRecord', treatmentRecordSchema);
