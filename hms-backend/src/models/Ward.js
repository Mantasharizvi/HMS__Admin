const mongoose = require('mongoose');

// One entry per physical bed in the ward, so Ward Management can show/edit
// bed-level status independently of who is currently admitted there.
const bedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true }, // e.g. "ICU-05", "A-21"
    status: {
      type: String,
      enum: ['vacant', 'occupied', 'reserved', 'cleaning'],
      default: 'vacant',
    },
  },
  { _id: false }
);

const wardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "ICU", "Ward A"
    beds: { type: Number, required: true },
    occupied: { type: Number, default: 0 },
    status: { type: String, default: '' }, // e.g. "Critical Care", "General Care"
    bedList: { type: [bedSchema], default: [] },
  },
  { timestamps: true }
);

// Auto-generate a bedList (e.g. "ICU-01".."ICU-12") the first time a ward is
// created, if one wasn't supplied explicitly.
wardSchema.pre('save', function (next) {
  if (this.isNew && (!this.bedList || this.bedList.length === 0) && this.beds) {
    const prefix = this.name.replace(/\s+/g, '').slice(0, 4).toUpperCase();
    this.bedList = Array.from({ length: this.beds }, (_, i) => ({
      bedNumber: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      status: 'vacant',
    }));
  }
  next();
});

module.exports = mongoose.model('Ward', wardSchema);
