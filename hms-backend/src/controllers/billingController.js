const asyncHandler = require('../utils/asyncHandler');
const Bill = require('../models/Bill');

// @desc    Record an OPD or IPD invoice once it's generated
// @route   POST /api/billing
const createBill = asyncHandler(async (req, res) => {
  const { type, patient, lineItems, total } = req.body;
  const bill = await Bill.create({ type, patient, lineItems, total });
  res.status(201).json({ success: true, data: bill });
});

// @route   GET /api/billing
const getBills = asyncHandler(async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  const bills = await Bill.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: bills.length, data: bills });
});

module.exports = { createBill, getBills };
