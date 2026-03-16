const express = require('express');
const router = express.Router();
const {
    createAnnouncement,
    getAnnouncements
} = require('../controllers/announcementController');

const { protect, authorize } = require('../middleware/authMiddleware');

router
    .route('/')
    .get(getAnnouncements)
    // Only Admin can create an announcement
    .post(protect, authorize('admin'), createAnnouncement);

module.exports = router;
