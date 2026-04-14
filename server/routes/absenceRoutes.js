const express = require('express')
const router = express.Router();
const { createAbsence, approveAbsence, getAllAbsences, getMyAbsences, deleteAbsence } = require('../controllers/absenceController');
const { authorize, protect } = require('../middleware/authMiddleware');
router.post('/', protect, createAbsence)
router.put('/:id', protect, authorize('admin', 'teacher'), approveAbsence);
router.get('/me', protect, getMyAbsences)
router.get('/', protect, getAllAbsences)
router.delete('/:id', protect, deleteAbsence)
module.exports = router;