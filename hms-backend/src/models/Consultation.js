const mongoose = require('mongoose');

// One prescription line item, e.g. { medicine: 'Paracetamol 500mg', dosage: '1-0-1', duration: '3 days' }
const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true },
    dosage: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patientCode: { type: String, default: '' }, // denormalized for quick display, e.g. OPD-101
    notes: { type: String, default: '' },
    reviewDate: { type: String, default: '' },
    prescriptions: [prescriptionItemSchema],
    consultationFee: { type: Number, default: 500 },
    labCharges: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);
