const express = require('express');
const router = express.Router();
const { 
    createConfession, 
    getConfessions, 
    updateConfession, 
    deleteConfession, 
    approveConfession, 
    getPendingConfessions,
    likeConfession 
} = require('../controllers/confessionController');
const { authorize, protect } = require('../middleware/authMiddleware')
const uploadCloud = require('../middleware/cloudinaryMiddleware')

// Base route: /api/confession
router.post('/', protect, uploadCloud.array('files', 5), createConfession)
router.get('/', protect, authorize('student', 'teacher', 'admin'), getConfessions)
router.get('/pending', protect, authorize('admin'), getPendingConfessions)
router.put('/:id', protect, updateConfession)
router.put('/:id/approve', protect, authorize('admin'), approveConfession)
router.put('/:id/like', protect, likeConfession)
router.delete('/:id', protect, authorize('admin', 'student', 'teacher'), deleteConfession)

module.exports = router;