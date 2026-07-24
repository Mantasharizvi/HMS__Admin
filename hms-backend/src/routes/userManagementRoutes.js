const express = require('express');
const {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  setUserPassword,
  getRoles,
  createRole,
  updateRole,
  getPermissions,
  updatePermission,
  getMyPermissions,
  getDoctorsList,
} = require('../controllers/userManagementController');
const { protect, authorize, authorizeModule } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Any authenticated user (Doctor, Nurse, Receptionist, Pharmacist, Admin) can
// check which pages their OWN role is granted — this must come before the
// Admin-only 'users' module routes below and is intentionally NOT gated by
// authorizeModule('users').
router.get('/my-permissions', getMyPermissions);


// User/Role/Permission management: Admin only, including viewing —
// this is the "users" module and is not part of the access granted to
// Doctor/Nurse/Receptionist (Ward Management + Reports) or Pharmacist
// (Pharmacy only).
// A user editing their OWN profile (ProfilePage) should always be allowed,
// regardless of role. Editing someone ELSE's account requires 'users'
// module access (Admin only). This keeps self-service profile edits working
// for Doctor/Nurse/Receptionist/Pharmacist while still locking down
// user-management proper.
const selfOrUsersModule = (req, res, next) => {
  if (req.user && String(req.user._id) === String(req.params.id)) return next();
  return authorizeModule('users')(req, res, next);
};

router.route('/').get(authorizeModule('users'), getUsers).post(authorize('Admin'), addUser);
router.route('/:id').put(selfOrUsersModule, updateUser).delete(authorize('Admin'), deleteUser);

// Admin-only: set another user's password directly from Edit Profile,
// no current-password check. A user's own password change instead goes
// through PUT /api/auth/change-password (requires current password).
router.route('/:id/set-password').put(authorize('Admin'), setUserPassword);

router.route('/roles').get(authorizeModule('users'), getRoles).post(authorize('Admin'), createRole);
router.route('/roles/:id').put(authorize('Admin'), updateRole);

router.route('/permissions').get(authorizeModule('users'), getPermissions);
router.route('/permissions/:id').put(authorize('Admin'), updatePermission);

// ... existing routes
router.get('/doctors', authorize('Admin', 'Receptionist', 'Doctor', 'Nurse'), getDoctorsList);
module.exports = router;
