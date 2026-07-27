const express = require('express');
const {
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
} = require('../controllers/pharmacyController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

// Pharmacy module: Admin and Pharmacist only.
router.use(protect, authorizeModule('pharmacy'));

router.route('/inventory').get(getInventory).post(addMedicine);
router.route('/inventory/:id').put(updateMedicine).delete(deleteMedicine);

router.get('/alerts', getExpiryAlerts);

// NOTE: '/purchases/import' must be registered before any '/purchases/:id'
// route is ever added, otherwise Express would treat "import" as an :id param.
router.route('/purchases/import').get(getPurchaseImports).post(bulkImportPurchases).delete(clearPurchaseImports);
router.route('/purchases').get(getPurchaseEntries).post(addPurchaseEntry);
router.route('/sales').get(getSales).post(createSale);

module.exports = router;