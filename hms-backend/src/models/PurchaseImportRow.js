const mongoose = require('mongoose');

// Stores one row from an uploaded purchase Excel sheet. `data` is intentionally
// a free-form object (Mixed type) since the columns in the uploaded file can
// vary from one import to the next - the frontend renders whatever keys exist.
const purchaseImportRowSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    importBatch: { type: String, index: true }, // groups rows uploaded together
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseImportRow', purchaseImportRowSchema);