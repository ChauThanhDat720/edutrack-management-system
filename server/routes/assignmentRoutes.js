const express = require('express');
const router = express.Router();
const { 
    createAssignment, 
    getAssignmentsByClass, 
    deleteAssignment 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('teacher', 'admin'), createAssignment);
router.get('/class/:classId', protect, getAssignmentsByClass);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAssignment);

module.exports = router;
