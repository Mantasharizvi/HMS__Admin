const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const permissionSchema = new mongoose.Schema(
  {
    permissionCode: { type: String, unique: true }, // e.g. PERM-001
    name: { type: String, required: true }, // e.g. "View Patients"
    category: { type: String, required: true }, // e.g. "Patient Management"
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

permissionSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.permissionCode) {
    const seq = await nextSequence('permission');
    this.permissionCode = `PERM-${String(seq).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Permission', permissionSchema);
