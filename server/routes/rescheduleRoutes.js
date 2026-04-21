const express = require('express');
const router = express.Router();
const {
    createRescheduleRequest,
    getMyRescheduleRequests,
    getAllRescheduleRequests,
    approveRescheduleRequest,
    rejectRescheduleRequest
} = require('../controllers/rescheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Teacher routes
router.post('/', authorize('teacher'), createRescheduleRequest);
router.get('/my', authorize('teacher'), getMyRescheduleRequests);

// Admin routes
router.get('/', authorize('admin'), getAllRescheduleRequests);
router.put('/:id/approve', authorize('admin'), approveRescheduleRequest);
router.put('/:id/reject', authorize('admin'), rejectRescheduleRequest);

module.exports = router;
