const express = require('express');
const router = express.Router();
const { getSubjects, createSubject } = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getSubjects);
router.post('/', protect, authorize('admin'), createSubject);

module.exports = router;
