const express = require('express');
const router = express.Router();
const { 
    submitAssignment, 
    getSubmissionsByAssignment, 
    getStudentSubmission 
} = require('../controllers/submissionController')
const { protect, authorize } = require('../middleware/authMiddleware')

router.post('/', protect, authorize('student'), submitAssignment)
router.get('/assignment/:assignmentId', protect, authorize('teacher', 'admin'), getSubmissionsByAssignment)
router.get('/my-submission/:assignmentId', protect, authorize('student'), getStudentSubmission)

module.exports = router;