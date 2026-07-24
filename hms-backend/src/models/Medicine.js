const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const medicineSchema = new mongoose.Schema(
  {
    medicineCode: { type: String, unique: true }, // e.g. MED-101
    name: { type: String, required: [true, 'Medicine name is required'] },
    category: { type: String, required: [true, 'Category is required'] },
    batch: { type: String, default: '' },
    stock: { type: Number, required: [true, 'Initial stock is required'], min: 0 },
    unit: { type: String, default: 'Boxes' },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
    expiry: { type: String, required: [true, 'Expiry date is required'] }, // ISO date string
  },
  { timestamps: true }
);

medicineSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.medicineCode) {
    const seq = await nextSequence('medicine');
    this.medicineCode = `MED-${100 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);
