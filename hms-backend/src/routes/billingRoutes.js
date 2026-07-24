const express = require('express');
const { createBill, getBills } = require('../controllers/billingController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

// Billing here is OPD/front-desk billing (pharmacy has its own sales
// billing under pharmacyRoutes.js) — same access as the OPD module.
router.use(protect, authorizeModule('billing'));

router.route('/').get(getBills).post(createBill);

module.exports = router;
