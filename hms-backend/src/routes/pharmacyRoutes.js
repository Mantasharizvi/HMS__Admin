const express = require('express');
const {
  getInventory,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getExpiryAlerts,
  getPurchaseEntries,
  addPurchaseEntry,
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

router.route('/purchases').get(getPurchaseEntries).post(addPurchaseEntry);
router.route('/sales').get(getSales).post(createSale);

module.exports = router;
