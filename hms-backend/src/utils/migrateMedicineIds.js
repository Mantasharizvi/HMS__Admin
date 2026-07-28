// One-time migration: backfills `medicineId` on Sale and PurchaseEntry
// records that were created before that field existed. Matches the old
// free-text `medicine` name against the current Medicine collection
// (case-insensitive, trimmed).
//
// Safe to run more than once — records that already have a medicineId are
// skipped every time.
//
// Usage:
//   node src/utils/migrateMedicineIds.js            # actually writes changes
//   node src/utils/migrateMedicineIds.js --dry-run   # preview only, no writes
//
// Or add to package.json scripts and run: npm run migrate:medicine-ids

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Medicine = require('../models/Medicine');
const Sale = require('../models/Sale');
const PurchaseEntry = require('../models/PurchaseEntry');

const isDryRun = process.argv.includes('--dry-run');

const normalize = (name) => String(name || '').trim().toLowerCase();

// Matches one collection's records against the inventory map, updates the
// ones it can, and returns the ones it couldn't (for the report).
async function migrateCollection(Model, label, byLowerName) {
  // Anything already carrying a medicineId is left alone.
  const pending = await Model.find({
    $or: [{ medicineId: { $exists: false } }, { medicineId: null }],
  });

  console.log(`\n${label}: ${pending.length} record(s) missing medicineId`);

  let matched = 0;
  const unmatched = [];
  const bulkOps = [];

  for (const doc of pending) {
    const medicine = byLowerName.get(normalize(doc.medicine));
    if (medicine) {
      matched += 1;
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { medicineId: medicine._id } },
        },
      });
    } else {
      unmatched.push({
        _id: doc._id.toString(),
        code: doc.saleCode || doc.purchaseCode || null,
        medicine: doc.medicine,
        createdAt: doc.createdAt,
      });
    }
  }

  if (!isDryRun && bulkOps.length > 0) {
    await Model.bulkWrite(bulkOps);
  }

  console.log(`  ✔ matched:   ${matched}${isDryRun ? ' (dry-run, not written)' : ''}`);
  console.log(`  ✘ unmatched: ${unmatched.length}`);

  return unmatched;
}

async function run() {
  await connectDB();

  console.log(isDryRun ? '=== DRY RUN — no changes will be written ===' : '=== Running migration ===');

  const allMedicines = await Medicine.find().select('_id name');
  const byLowerName = new Map(allMedicines.map((m) => [normalize(m.name), m]));
  console.log(`Loaded ${allMedicines.length} medicine(s) from inventory for matching.`);

  const unmatchedSales = await migrateCollection(Sale, 'Sale', byLowerName);
  const unmatchedPurchases = await migrateCollection(PurchaseEntry, 'PurchaseEntry', byLowerName);

  const totalUnmatched = unmatchedSales.length + unmatchedPurchases.length;

  if (totalUnmatched > 0) {
    const reportPath = path.join(__dirname, '..', '..', 'migration-unmatched-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), unmatchedSales, unmatchedPurchases }, null, 2)
    );
    console.log(`\n⚠️  ${totalUnmatched} record(s) could not be matched to any current medicine.`);
    console.log(`   Common causes: the medicine was later renamed, or was deleted from inventory.`);
    console.log(`   Full list written to: ${reportPath}`);
    console.log('   Fix these manually (e.g. re-add the medicine, or hand-edit medicineId in the DB) before relying on medicineId everywhere.');
  } else {
    console.log('\n✅ Every record was matched. No manual follow-up needed.');
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});