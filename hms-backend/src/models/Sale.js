const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const saleSchema = new mongoose.Schema(
  {
    saleCode: { type: String, unique: true }, // e.g. SAL-301
    billCode: { type: String, default: '' }, // shared by every item saved in the same bill
    patient: { type: String, required: true },
    // The real link to inventory. Always required going forward — matching
    // by name alone let two differently-priced/expiring "Paracetamol"
    // entries get silently confused with each other.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    // Denormalized copy of Medicine.name at the time of sale, kept only so
    // old rows/reports can display a name without an extra lookup. This is
    // always set server-side from the resolved Medicine document — never
    // trust this field if it comes from the client.
    medicine: { type: String, required: true },
    qty: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

saleSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.saleCode) {
    const seq = await nextSequence('sale');
    this.saleCode = `SAL-${300 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);