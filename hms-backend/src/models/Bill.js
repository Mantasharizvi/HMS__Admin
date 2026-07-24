const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const billSchema = new mongoose.Schema(
  {
    billCode: { type: String, unique: true }, // e.g. BILL-601
    type: { type: String, enum: ['OPD', 'IPD'], required: true },
    patient: { type: String, required: [true, 'Patient name is required'] },
    lineItems: [
      {
        label: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: [true, 'Total amount is required'] },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.billCode) {
    const seq = await nextSequence('bill');
    this.billCode = `BILL-${600 + seq}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
