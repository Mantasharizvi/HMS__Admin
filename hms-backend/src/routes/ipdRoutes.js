const express = require('express');
const {
  getWards,
  createWard,
  addBedsToWard,
  updateBedStatus,
  getAdmissions,
  admitPatient,
  updateAdmission,
  dischargePatient,
  getTreatmentRecords,
  addTreatmentRecord,
} = require('../controllers/ipdController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

// Ward Management (IPD) module: Admin, Doctor, Nurse, Receptionist only.
router.use(protect, authorizeModule('ipd'));

router.route('/wards').get(getWards).post(createWard);
router.post('/wards/:wardId/beds', addBedsToWard);
router.put('/wards/:wardId/beds/:bedNumber', updateBedStatus);

router.route('/admissions').get(getAdmissions).post(admitPatient);
router.route('/admissions/:id').put(updateAdmission);
router.post('/admissions/:id/discharge', dischargePatient);

router.route('/treatments').get(getTreatmentRecords).post(addTreatmentRecord);

module.exports = router;
