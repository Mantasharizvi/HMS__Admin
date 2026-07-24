const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Any logged-in user can use the header search (like the basic dashboard
// widgets) — it only surfaces what already exists in the DB, no module
// gating here. If you want per-role filtering (e.g. Pharmacist should only
// see medicine results), that can be added later.
router.use(protect);

router.get('/', globalSearch);

module.exports = router;
