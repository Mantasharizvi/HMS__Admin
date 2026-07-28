const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const purchaseEntrySchema = new mongoose.Schema(
  {
    purchaseCode: { type: String, unique: true }, // e.g. PUR-201
    supplier: { type: String, required: true },
    // The medicine name is now entered as free text on the Purchase Entry
    // form. When it matches an existing inventory item (case-insensitive,
    // resolved server-side) this still links to that Medicine record and
    // restocks it; when it doesn't match anything yet, the entry is still
    // saved for record-keeping (same behavior as unmatched Excel-import
    // rows) but medicineId stays null and stock isn't auto-incremented.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', default: null },
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