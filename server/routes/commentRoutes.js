const express = require('express');
const router = express.Router();
const { createComment, getComment, deleteComment } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base route: /api/comment
router.get('/:confessionId', protect, getComment);
router.post('/:confessionId', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
