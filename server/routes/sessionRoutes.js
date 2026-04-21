const express = require('express');
const router = express.Router();
const { getMySchedule, getAttendanceSheet, submitAttendance, getStudentSchedule, getStudentAttendance, getAvailableTeachers, createSession, getSessionsByClass } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student route
router.get('/student/schedule', authorize('student'), getStudentSchedule);
router.get('/student/attendance', authorize('student'), getStudentAttendance);

// Routes for both teacher and admin
router.get('/available-teachers', authorize('teacher', 'admin'), getAvailableTeachers);
router.get('/class/:classId', authorize('teacher', 'admin'), getSessionsByClass);
router.get('/:sessionId/students', authorize('teacher', 'admin'), getAttendanceSheet);
router.post('/:sessionId/attendance', authorize('teacher', 'admin'), submitAttendance);

// Routes for specific roles
router.get('/my-schedule', authorize('teacher'), getMySchedule);
router.post('/', authorize('admin', 'teacher'), createSession);

module.exports = router;