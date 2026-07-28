const asyncHandler = require('../utils/asyncHandler');
const Medicine = require('../models/Medicine');
const PurchaseEntry = require('../models/PurchaseEntry');
const PurchaseImportRow = require('../models/PurchaseImportRow');
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
  const name = String(req.body.name || '').trim();

  // Block case-insensitive duplicates ("Paracetamol" vs "paracetamol") at
  // creation time. Purchases/sales are matched by medicineId now, but two
  // near-identical inventory rows are still confusing for staff and split
  // one drug's stock across two records.
  if (name) {
    const duplicate = await Medicine.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (duplicate) {
      res.status(400);
      throw new Error(`"${name}" already exists in inventory (as "${duplicate.name}"). Edit that entry or use Stock Management to adjust its quantity instead.`);
    }
  }

  const medicine = await Medicine.create({ ...req.body, name });
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
  const { medicine, qty } = req.body;
  const medicineName = String(medicine ?? '').trim();
  const purchaseQty = Math.abs(Number(qty));

  if (!medicineName) {
    res.status(400);
    throw new Error('Please enter a medicine name');
  }
  if (!purchaseQty || purchaseQty <= 0) {
    res.status(400);
    throw new Error('A valid quantity is required');
  }

  // Restock by medicineId, not by typed/free-text name - this is what
  // actually guarantees the purchase lands on the right inventory row even
  // if two medicines happen to share a similar name.
  const updatedMedicine = await Medicine.findByIdAndUpdate(
    medicineId,
    { $inc: { stock: purchaseQty } },
    { new: true }
  );

  if (!updatedMedicine) {
    res.status(404);
    throw new Error('Selected medicine no longer exists in inventory');
  }

  let purchase;
  try {
    purchase = await PurchaseEntry.create({
      ...req.body,
      medicineId: updatedMedicine._id,
      medicine: updatedMedicine.name, // denormalized name resolved server-side, never trust the client's copy
      qty: purchaseQty,
    });
  } catch (err) {
    // Roll back the stock bump if the purchase record itself failed to save
    await Medicine.findByIdAndUpdate(medicineId, { $inc: { stock: -purchaseQty } });
    throw err;
  }

  res.status(201).json({ success: true, data: purchase });
});

/* -------------------- Excel-imported purchase data -------------------- */
// These rows are dynamic/free-form: whatever columns exist in the uploaded
// Excel sheet get stored as-is under `data` and rendered as-is on the frontend.

// @route   GET /api/pharmacy/purchases/import
const getPurchaseImports = asyncHandler(async (req, res) => {
  const rows = await PurchaseImportRow.find().sort({ createdAt: -1 });
  res.json({ success: true, count: rows.length, data: rows });
});

// A row needs at least these to be usable for stock/report purposes.
// Column names arrive pre-normalized by the frontend (remapExcelRow), e.g.
// "Medicine Name" / "Drug" / "Product" all become `medicine` already.
const REQUIRED_IMPORT_FIELDS = ['medicine', 'qty', 'cost'];

// @route   POST /api/pharmacy/purchases/import
// body: { rows: [ { <col1>: val, <col2>: val, ... }, ... ] }
const bulkImportPurchases = asyncHandler(async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400);
    throw new Error('No rows found to import');
  }
  if (rows.length > 5000) {
    res.status(400);
    throw new Error('Too many rows in one file (max 5000). Please split the file.');
  }

  // Pull the current inventory once so every row can be matched against it
  // in memory, instead of one DB round-trip per row.
  const inventory = await Medicine.find().select('_id name');
  const byLowerName = new Map(inventory.map((m) => [m.name.trim().toLowerCase(), m]));

  const validRows = [];
  const rejected = []; // { row: <original index, 1-based>, reason }
  const unmatchedNames = new Set(); // known-valid rows whose medicine isn't in inventory yet

  rows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const medicineName = String(row.medicine ?? '').trim();
    const qty = Number(row.qty);
    const cost = Number(row.cost);

    // Required-field / type checks
    const missing = REQUIRED_IMPORT_FIELDS.filter((f) => row[f] === undefined || row[f] === null || row[f] === '');
    if (missing.length > 0) {
      rejected.push({ row: rowNumber, reason: `Missing required column(s): ${missing.join(', ')}` });
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      rejected.push({ row: rowNumber, reason: `Quantity must be a positive number (got "${row.qty}")` });
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      rejected.push({ row: rowNumber, reason: `Cost must be a non-negative number (got "${row.cost}")` });
      return;
    }
    if (row.expiry && Number.isNaN(new Date(row.expiry).getTime())) {
      rejected.push({ row: rowNumber, reason: `Expiry date is not a recognizable date (got "${row.expiry}")` });
      return;
    }

    // Try to resolve against existing inventory (case-insensitive). Rows
    // that don't match a known medicine are still imported for record-
    // keeping (matches prior behavior), but flagged so staff can see which
    // ones need a matching "Add Medicine" entry before stock can reconcile.
    const match = byLowerName.get(medicineName.toLowerCase());
    if (!match) unmatchedNames.add(medicineName);

    validRows.push({
      ...row,
      medicine: medicineName,
      qty,
      cost,
      medicineId: match ? match._id : null,
      matched: Boolean(match),
    });
  });

  if (validRows.length === 0) {
    res.status(400);
    throw new Error(`All ${rows.length} row(s) failed validation. First issue: row ${rejected[0].row} — ${rejected[0].reason}`);
  }

  const importBatch = new Date().toISOString();
  const docs = validRows.map((row) => ({ data: row, importBatch }));
  const created = await PurchaseImportRow.insertMany(docs);

  res.status(201).json({
    success: true,
    count: created.length,
    skipped: rejected.length,
    unmatchedMedicines: [...unmatchedNames], // names not found in current inventory - surfaced so the frontend can warn about them
    rejectedRows: rejected,
    data: created,
  });
});

// @route   DELETE /api/pharmacy/purchases/import
// Clears all previously imported Excel rows (used before re-importing a fresh file).
const clearPurchaseImports = asyncHandler(async (req, res) => {
  await PurchaseImportRow.deleteMany({});
  res.json({ success: true, message: 'Imported purchase data cleared' });
});

/* -------------------- Sales / billing -------------------- */

// @route   GET /api/pharmacy/sales
const getSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find().sort({ createdAt: -1 });
  res.json({ success: true, count: sales.length, data: sales });
});

// @route   POST /api/pharmacy/sales
const createSale = asyncHandler(async (req, res) => {
  const { medicineId, qty } = req.body;
  const saleQty = Math.abs(Number(qty));

  if (!medicineId) {
    res.status(400);
    throw new Error('Please select a medicine from inventory');
  }
  if (!saleQty || saleQty <= 0) {
    res.status(400);
    throw new Error('A valid quantity is required');
  }

  // Atomically check AND decrement stock in a single DB operation, keyed by
  // medicineId (not name) so it can never land on the wrong inventory row -
  // and so two simultaneous sales can't both pass a "check" that's already
  // stale by the time they write. The `stock: { $gte: saleQty }` clause
  // makes this fail (return null) instead of allowing stock to go negative.
  const updatedMedicine = await Medicine.findOneAndUpdate(
    { _id: medicineId, stock: { $gte: saleQty } },
    { $inc: { stock: -saleQty } },
    { new: true }
  );

  if (!updatedMedicine) {
    // Figure out *why* it failed, just to give a clearer error message.
    const existing = await Medicine.findById(medicineId);
    res.status(400);
    if (!existing) {
      throw new Error('Selected medicine no longer exists in inventory');
    }
    throw new Error(
      `Insufficient stock for "${existing.name}". Available: ${existing.stock}, requested: ${saleQty}`
    );
  }

  // Stock is already reserved/decremented at this point. If creating the
  // sale record itself fails, roll the stock back so it isn't lost.
  let sale;
  try {
    sale = await Sale.create({
      ...req.body,
      medicineId: updatedMedicine._id,
      medicine: updatedMedicine.name, // denormalized name resolved server-side, never trust the client's copy
      qty: saleQty,
    });
  } catch (err) {
    await Medicine.findByIdAndUpdate(medicineId, { $inc: { stock: saleQty } });
    throw err;
  }

  if (updatedMedicine.stock <= LOW_STOCK_THRESHOLD) {
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
  getPurchaseImports,
  bulkImportPurchases,
  clearPurchaseImports,
  getSales,
  createSale,
};