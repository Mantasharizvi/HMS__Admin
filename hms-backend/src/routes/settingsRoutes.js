const express = require('express');
const { getHospitalSettings, updateHospitalSettings, getDepartments } = require('../controllers/settingsController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Departments list: any authenticated user can read this (needed for
// Department dropdowns on Patient Registration, Add User, etc. across
// every role) — deliberately NOT gated by authorizeModule('settings').
router.get('/departments', getDepartments);

// Full hospital settings (name, address, contact info, edit departments): Admin only.
router.use(authorizeModule('settings'));
router.route('/hospital').get(getHospitalSettings).put(updateHospitalSettings);

module.exports = router;