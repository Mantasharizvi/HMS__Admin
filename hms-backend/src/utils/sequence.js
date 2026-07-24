const mongoose = require('mongoose');

// Tracks the last-used number per sequence name (e.g. "patient", "user").
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically returns the next number in a named sequence, starting at 1.
 * Safe under concurrent calls - each caller gets a unique number because
 * $inc on a single document is atomic in MongoDB, unlike counting documents
 * and computing count + 1 in application code.
 *
 * @param {string} name - sequence name, e.g. 'user', 'patient', 'appointment'
 * @returns {Promise<number>}
 */
async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

module.exports = { Counter, nextSequence };
