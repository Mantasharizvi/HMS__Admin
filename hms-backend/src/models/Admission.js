const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const admissionSchema = new mongoose.Schema(
  {
    admissionCode: { type: String, unique: true }, // e.g. IPD-401
    patient: { type: String, required: [true, 'Patient name is required'] },
    admissionDate: { type: String, required: [true, 'Admission date is required'] },
    ward: { type: String, required: [true, 'Ward preference is required'] },
    doctor: { type: String, default: '' },
    bed: { type: String, required: [true, 'Bed allocation number is required'] },
    roomCharges: { type: Number, default: 0 },
    contact: { type: String, required: [true, 'Emergency contact is required'] },
    insurance: { type: String, default: '' },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Admitted', 'Monitoring', 'Recovery', 'Discharged'],
      default: 'Admitted',
    },

    // Discharge details, populated when discharged
    dischargeDate: { type: String, default: '' },
    dischargeCondition: { type: String, default: '' },
    dischargeSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

admissionSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.admissionCode) {
    const seq = await nextSequence('admission');
    this.admissionCode = `IPD-${400 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Admission', admissionSchema);
