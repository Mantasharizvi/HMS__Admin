const express = require('express');
const { getOpdReport, getIpdReport, getPharmacyReport, getRevenueReport } = require('../controllers/reportsController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

// Reports & Analytics tables: Admin, Doctor, Nurse, Receptionist.
router.use(protect, authorizeModule('reports'));

router.get('/opd', getOpdReport);
router.get('/ipd', getIpdReport);
router.get('/pharmacy', getPharmacyReport);
router.get('/revenue', getRevenueReport);

module.exports = router;
