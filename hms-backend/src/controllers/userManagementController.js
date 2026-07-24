const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

/* -------------------- Users -------------------- */

// @route   GET /api/users
// @route   GET /api/users?role=Doctor   (used by dropdowns elsewhere in the app)
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @route   POST /api/users
const addUser = asyncHandler(async (req, res) => {
  const { name, email, department, role, phone, license } = req.body;

  // Staff created by an admin get a temporary password they should change on first login
  const tempPassword = Math.random().toString(36).slice(-10);

  const user = await User.create({
    name,
    email,
    department,
    role,
    phone,
    license,
    password: tempPassword,
  });

  res.status(201).json({
    success: true,
    data: user,
    tempPassword, // return once so an admin can share it out-of-band; not stored in plaintext
  });
});

// @route   PUT /api/users/:id  (profile update)
// @route   PUT /api/users/:id  (profile update)
// Only these fields are ever editable from the profile form. Whitelisting
// (instead of spreading the whole req.body) protects against the frontend
// accidentally sending display-only computed fields back — e.g. `lastLogin`
// and `memberSince` are formatted strings for display, not real dates, and
// would otherwise crash the Date cast on save.
const EDITABLE_PROFILE_FIELDS = ['name', 'email', 'department', 'role', 'phone', 'license', 'status'];

const updateUser = asyncHandler(async (req, res) => {
  const updates = {};
  EDITABLE_PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @route   DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, message: 'User removed' });
});

// @desc    Admin sets a new password for ANOTHER user's account, from the
//          Edit Profile screen in User Management. No current-password
//          check here — that's the whole point of the admin override; a
//          user changing their OWN password instead goes through
//          PUT /api/auth/change-password, which does require it.
// @route   PUT /api/users/:id/set-password
// @access  Admin only
const setUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.params.id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.password = newPassword; // re-hashed by the User model's pre-save hook
  await user.save();

  res.json({ success: true, message: `Password updated for ${user.name}` });
});

/* -------------------- Roles -------------------- */

// @route   GET /api/users/roles
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ createdAt: 1 });
  res.json({ success: true, count: roles.length, data: roles });
});

// @route   POST /api/users/roles
const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Please enter a role name');
  }
  const role = await Role.create({ name, description, permissions });
  res.status(201).json({ success: true, data: role });
});

// @route   PUT /api/users/roles/:id
const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  res.json({ success: true, data: role });
});

/* -------------------- Permissions -------------------- */

// @route   GET /api/users/permissions
const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find().sort({ category: 1 });
  res.json({ success: true, count: permissions.length, data: permissions });
});

// @route   PUT /api/users/permissions/:id  (toggle enabled)
const updatePermission = asyncHandler(async (req, res) => {
  const permission = await Permission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!permission) {
    res.status(404);
    throw new Error('Permission not found');
  }
  res.json({ success: true, data: permission });
});

// @route   GET /api/users/my-permissions
// Any authenticated user can call this (no 'users' module restriction) to
// find out which pages their OWN role has been granted access to. Used by
// the frontend to only show sidebar/dashboard links Admin has switched on
// for that role. Admin itself (role.permissions includes the 'All'
// sentinel) always gets isAdmin: true and sees everything.
const getMyPermissions = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ name: req.user.role });

  if (!role || role.permissions?.includes('All')) {
    return res.json({ success: true, isAdmin: true, permissions: [] });
  }

  const granted = await Permission.find({ _id: { $in: role.permissions || [] } }).select('name category');
  res.json({
    success: true,
    isAdmin: false,
    permissions: granted.map((p) => ({ name: p.name, category: p.category })),
  });
});

// Get all registered doctors
const getDoctorsList = asyncHandler(async (req, res, next) => {
  // `role` on the User model is a plain string (see models/User.js enum), not a Role reference
  const doctors = await User.find({
    role: 'Doctor',
    status: 'Active',
  }).select('name email department phone');

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

module.exports = {
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
};