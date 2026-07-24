const express = require('express');
const {
  getStats,
  getRevenueChart,
  getAppointmentStatusChart,
  getDepartmentLoad,
  getRecentPatients,
  getNotifications,
  getQuickWidgets,
  getServiceDistribution,
} = require('../controllers/dashboardController');
const { protect, authorizeModule } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Basic dashboard widgets: available to any logged-in user.
router.get('/stats', getStats);
router.get('/recent-patients', getRecentPatients);
router.get('/notifications', getNotifications);
router.get('/quick-widgets', getQuickWidgets);

// Report-generation endpoints: Admin, Doctor, Nurse, Receptionist only
// (this is the data behind Reports & Analytics -> Revenue/Analytics charts).
router.get('/revenue-chart', authorizeModule('reports'), getRevenueChart);
router.get('/appointment-status', authorizeModule('reports'), getAppointmentStatusChart);
router.get('/department-load', authorizeModule('reports'), getDepartmentLoad);
router.get('/service-distribution', authorizeModule('reports'), getServiceDistribution);

module.exports = router;
