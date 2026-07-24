const asyncHandler = require('../utils/asyncHandler');
const HospitalSettings = require('../models/HospitalSettings');

// There is only ever one settings document. Create it with defaults the
// first time it's requested.
async function getOrCreateSettings() {
  let settings = await HospitalSettings.findOne();
  if (!settings) settings = await HospitalSettings.create({});
  return settings;
}

// @route   GET /api/settings/hospital
const getHospitalSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings });
});

// @route   GET /api/settings/departments
// Read-only, no sensitive hospital details — any authenticated user can call
// this to populate a Department dropdown (Patient Registration, Add User,
// Appointment forms, etc.), regardless of role.
const getDepartments = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings.departments || [] });
});

// @route   PUT /api/settings/hospital
const updateHospitalSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();

  if (Array.isArray(req.body.departments)) {
    const seen = new Set();
    req.body.departments = req.body.departments.reduce((unique, dept) => {
      const name = String(dept).trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
      return unique;
    }, []);
  }

  Object.assign(settings, req.body);
  await settings.save();
  res.json({ success: true, data: settings });
});

module.exports = { getHospitalSettings, updateHospitalSettings, getDepartments };