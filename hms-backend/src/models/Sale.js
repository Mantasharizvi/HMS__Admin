const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const saleSchema = new mongoose.Schema(
  {
    saleCode: { type: String, unique: true }, // e.g. SAL-301
    patient: { type: String, required: true },
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
