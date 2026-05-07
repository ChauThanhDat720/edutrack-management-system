const express = require('express');
const router = express.Router();
const { getCurriculums, upsertCurriculum } = require('../controllers/curriculumController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getCurriculums)
    .post(protect, authorize('admin'), upsertCurriculum);

module.exports = router;
