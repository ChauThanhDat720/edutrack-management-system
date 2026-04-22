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
const validate = require('../middleware/validateMiddleware');
const { createRescheduleSchema } = require('../validations/rescheduleValidation');

router.use(protect);

// Teacher routes
router.post('/', authorize('teacher'), validate(createRescheduleSchema), createRescheduleRequest);
router.get('/my', authorize('teacher'), getMyRescheduleRequests);

// Admin routes
router.get('/', authorize('admin'), getAllRescheduleRequests);
router.put('/:id/approve', authorize('admin'), approveRescheduleRequest);
router.put('/:id/reject', authorize('admin'), rejectRescheduleRequest);

module.exports = router;
