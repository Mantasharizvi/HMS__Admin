const express = require('express');
const {
  getPatients,
  registerPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getConsultations,
  createConsultation,
} = require('../controllers/opdController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

// OPD module: Admin, Doctor, Nurse, Receptionist. Pharmacist is excluded —
// pharmacist access is limited to the Pharmacy module only.
router.use(protect, authorizeModule('opd'));

router.route('/patients').get(getPatients).post(registerPatient);
router.route('/patients/:id').get(getPatientById).put(updatePatient).delete(deletePatient);

router.route('/appointments').get(getAppointments).post(createAppointment);
router.route('/appointments/:id').put(updateAppointment).delete(deleteAppointment);

router.route('/consultations').get(getConsultations).post(createConsultation);

module.exports = router;
