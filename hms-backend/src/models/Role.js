const mongoose = require('mongoose');
const { nextSequence } = require('../utils/sequence');

const roleSchema = new mongoose.Schema(
  {
    roleCode: { type: String, unique: true }, // e.g. ROLE-01
    name: { type: String, required: [true, 'Role name is required'], unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }], // array of permission names/ids enabled for this role
  },
  { timestamps: true }
);

roleSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (!this.roleCode) {
    const seq = await nextSequence('role');
    this.roleCode = `ROLE-${String(seq).padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema);
