const express = require('express');
const router = express.Router();
const { getMySchedule, getAttendanceSheet, submitAttendance, getStudentSchedule } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student route
router.get('/student/schedule', authorize('student'), getStudentSchedule);

// Chỉ giáo viên và admin mới được vào các route này
router.use(authorize('teacher', 'admin'));

router.get('/my-schedule', getMySchedule);
router.get('/:sessionId/students', getAttendanceSheet);
router.post('/:sessionId/attendance', submitAttendance);

module.exports = router;