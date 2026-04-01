const express = require('express');
const router = express.Router();
const { createConfession, getConfessions, updateConfession, deleteConfession, approveConfession } = require('../controllers/confessionController');
const { authorize, protect } = require('../middleware/authMiddleware')
const uploadCloud = require('../config/cloudinary')
router.post('/', protect, uploadCloud.array('files', 5), createConfession)
router.get('/confession',
    protect,
    authorize('student, teacher'),
    getConfessions
)
router.put('/confession/:confessionId',
    protect,
    updateConfession
)
module.exports = router