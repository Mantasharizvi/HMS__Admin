const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { nextSequence } = require('../utils/sequence');

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true }, // e.g. USR-001, auto-generated
    name: { type: String, required: [true, 'Full name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist'],
      default: 'Receptionist',
    },
    department: { type: String, default: '' },
    phone: { type: String, default: '' },
    license: { type: String, default: '' }, // for doctors
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastLogin: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    notificationPrefs: {
      type: Object,
      default: {
        lowStock: { email: true, sms: false, push: true },
        appointments: { email: true, sms: true, push: true },
        billing: { email: true, sms: false, push: false },
        critical: { email: true, sms: true, push: true },
      },
    },
  },
  { timestamps: true } // gives createdAt -> used as "memberSince"
);

// Auto-generate a human-friendly userId like USR-001
userSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.userId) {
    const seq = await nextSequence('user');
    this.userId = `USR-${String(seq).padStart(3, '0')}`;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
