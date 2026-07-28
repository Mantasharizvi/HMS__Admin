const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const purchaseEntrySchema = new mongoose.Schema(
  {
    purchaseCode: { type: String, unique: true }, // e.g. PUR-201
    supplier: { type: String, required: true },
    // The real link to inventory (see Sale model for why name-only matching
    // was unsafe). Purchase entries always restock an EXISTING medicine
    // record — adding a brand-new medicine still happens on the Inventory
    // page (Add Medicine), which is the single source of truth for names.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    // Denormalized copy of Medicine.name, always set server-side.
    medicine: { type: String, required: true },
    qty: { type: Number, required: true },
    cost: { type: Number, required: true },
    category: { type: String, default: '' },
    unit: { type: String, default: '' },
    expiry: { type: String, default: '' }, // ISO date string
    batchNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

purchaseEntrySchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.purchaseCode) {
    const seq = await nextSequence('purchase');
    this.purchaseCode = `PUR-${200 + seq}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseEntry', purchaseEntrySchema);