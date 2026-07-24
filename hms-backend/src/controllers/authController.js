const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Login admin/staff user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Wrong ID or password. Please try again.');
  }

  if (user.status === 'Inactive') {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      lastLogin: user.lastLogin,
      memberSince: user.createdAt,
      status: user.status,
    },
  });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Forgot password - emails a reset link to the registered address
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase().trim() });

  // NOTE: this deliberately reveals whether an email is registered, per
  // product requirement. The more common security practice is to always
  // return a generic "if that email exists..." message so outsiders can't
  // use this endpoint to discover which emails have accounts. If that
  // matters for your deployment, revert to the generic message instead.
  if (!user) {
    res.status(404);
    throw new Error('This email is not registered with MediCore HMS');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: '[MediCore HMS] Password reset request',
    text: `We received a request to reset your password. This link expires in 30 minutes: ${resetUrl}. If you didn't request this, you can ignore this email.`,
    html: `<p>We received a request to reset your MediCore HMS password.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 30 minutes).</p><p>If you didn't request this, you can ignore this email.</p>`,
  });

  res.json({ success: true, message: 'A password reset link has been sent to your email.' });
});

// @desc    Reset password using the token emailed by forgotPassword
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// @desc    Change the logged-in user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword; // re-hashed by the pre-save hook
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { login, getMe, forgotPassword, resetPassword, changePassword };
