const express = require('express');
const router = express.Router();
const {
    createAnnouncement,
    getAnnouncements,
    getAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
    .route('/')
    .get(getAnnouncements)
    // Only Admin can create an announcement
    .post(protect, authorize('admin'), createAnnouncement);

router.get('/:id', getAnnouncement);
router.put('/:id', protect, authorize('admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);
module.exports = router;
