const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const MODULE_PERMISSIONS = require('../config/modulePermissions');

// Verifies the Bearer token and attaches the user to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed or expired');
  }
});

// Restricts a route to specific roles, e.g. authorize('Admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role "${req.user?.role}" is not permitted to perform this action`);
  }
  next();
};

// Restricts a route to whichever roles are allowed for a given module,
// as defined in config/modulePermissions.js. Use this instead of listing
// roles by hand in every route file — e.g. authorizeModule('pharmacy').
const authorizeModule = (moduleKey) => (req, res, next) => {
  const allowedRoles = MODULE_PERMISSIONS[moduleKey];

  if (!allowedRoles) {
    // Fail closed: an unlisted module key is a config mistake, not an
    // implicit "allow everyone".
    res.status(500);
    throw new Error(`No permission rule configured for module "${moduleKey}"`);
  }

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role "${req.user?.role}" does not have access to the "${moduleKey}" module`);
  }

  next();
};

module.exports = { protect, authorize, authorizeModule };
