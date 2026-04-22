const express = require('express');
const router = express.Router();
const { updateStudentGrade, getGradesByTeacher, getGradesByStudent } = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { updateGradeSchema } = require('../validations/gradeValidation');

router.post('/', protect, authorize('teacher'), validate(updateGradeSchema), updateStudentGrade);

router.get('/class/:classId',
    protect,
    authorize('teacher', 'admin'),
    getGradesByTeacher);

router.get('/student/:studentId',
    protect,
    authorize('admin', 'teacher', 'student'),
    getGradesByStudent);

module.exports = router;