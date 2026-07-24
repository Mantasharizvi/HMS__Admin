const asyncHandler = require('../utils/asyncHandler');
const Medicine = require('../models/Medicine');
const PurchaseEntry = require('../models/PurchaseEntry');
const Sale = require('../models/Sale');
const notify = require('../utils/notify');

const LOW_STOCK_THRESHOLD = 20;

/* -------------------- Inventory -------------------- */

// @route   GET /api/pharmacy/inventory
const getInventory = asyncHandler(async (req, res) => {
  const inventory = await Medicine.find().sort({ createdAt: -1 });
  res.json({ success: true, count: inventory.length, data: inventory });
});

// @route   POST /api/pharmacy/inventory
const addMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: medicine });
});

// @route   PUT /api/pharmacy/inventory/:id
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }
  res.json({ success: true, data: medicine });
});

// @route   DELETE /api/pharmacy/inventory/:id
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }
  res.json({ success: true, message: 'Medicine removed from inventory' });
});

/* -------------------- Expiry alerts -------------------- */
// Derived from inventory: anything expiring within 60 days.
// @route   GET /api/pharmacy/alerts
const getExpiryAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const critical = new Date();
  critical.setDate(now.getDate() + 15);
  const soon = new Date();
  soon.setDate(now.getDate() + 60);

  const items = await Medicine.find({ expiry: { $lte: soon.toISOString().slice(0, 10) } });

  const alerts = items.map((m) => ({
    medicine: m.name,
    expiry: m.expiry,
    status: new Date(m.expiry) <= critical ? 'Critical' : 'Expiring soon',
  }));

  res.json({ success: true, count: alerts.length, data: alerts });
});

/* -------------------- Purchase entries -------------------- */

// @route   GET /api/pharmacy/purchases
const getPurchaseEntries = asyncHandler(async (req, res) => {
  const purchases = await PurchaseEntry.find().sort({ createdAt: -1 });
  res.json({ success: true, count: purchases.length, data: purchases });
});

// @route   POST /api/pharmacy/purchases
const addPurchaseEntry = asyncHandler(async (req, res) => {
  const purchase = await PurchaseEntry.create(req.body);

  // Increase stock for the matching medicine, if found by name
  await Medicine.findOneAndUpdate(
    { name: purchase.medicine },
    { $inc: { stock: purchase.qty } }
  );

  res.status(201).json({ success: true, data: purchase });
});

/* -------------------- Sales / billing -------------------- */

// @route   GET /api/pharmacy/sales
const getSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find().sort({ createdAt: -1 });
  res.json({ success: true, count: sales.length, data: sales });
});

// @route   POST /api/pharmacy/sales
const createSale = asyncHandler(async (req, res) => {
  const sale = await Sale.create(req.body);

  // Decrease stock for the matching medicine, if found by name
  const updatedMedicine = await Medicine.findOneAndUpdate(
    { name: sale.medicine },
    { $inc: { stock: -Math.abs(sale.qty) } },
    { new: true }
  );

  if (updatedMedicine && updatedMedicine.stock <= LOW_STOCK_THRESHOLD) {
    notify({
      type: 'warning',
      title: 'Low stock alert',
      message: `${updatedMedicine.name} is down to ${updatedMedicine.stock} ${updatedMedicine.unit || 'units'} after a sale.`,
      category: 'lowStock',
    }).catch(() => {});
  }

  res.status(201).json({ success: true, data: sale });
});

module.exports = {
  getInventory,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getExpiryAlerts,
  getPurchaseEntries,
  addPurchaseEntry,
  getSales,
  createSale,
};
