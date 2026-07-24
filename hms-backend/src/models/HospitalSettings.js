const mongoose = require('mongoose');

// Singleton document (only one row ever exists) holding hospital-wide
// settings shown on Settings > Hospital info.
const hospitalSettingsSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, default: 'MediCore Multi-speciality Hospital' },
    registrationNumber: { type: String, default: 'HMS-REG-88213' },
    contactEmail: { type: String, default: 'contact@medicorehms.com' },
    contactPhone: { type: String, default: '+91 522 456 7890' },
    address: { type: String, default: '14 MG Road, Hazratganj, Lucknow, UP 226001' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    departments: {
      type: [String],
      default: ['General', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'ENT', 'Not recommended'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HospitalSettings', hospitalSettingsSchema);
