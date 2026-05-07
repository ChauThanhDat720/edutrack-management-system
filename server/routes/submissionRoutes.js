const express = require('express');
const router = express.Router();
const { 
    submitAssignment, 
    getSubmissionsByAssignment, 
    getStudentSubmission,
    gradeSubmission
} = require('../controllers/submissionController')
const { protect, authorize } = require('../middleware/authMiddleware')

router.post('/', protect, authorize('student'), submitAssignment)
router.get('/assignment/:assignmentId', protect, authorize('teacher', 'admin'), getSubmissionsByAssignment)
router.get('/my-submission/:assignmentId', protect, authorize('student'), getStudentSubmission)
router.put('/:id/grade', protect, authorize('teacher', 'admin'), gradeSubmission)

module.exports = router;