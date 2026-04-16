const express = require('express');
const router = express.Router();
const conductController = require('../controllers/conductController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, conductController.getAllConductRecord);
router.post('/', protect, authorize('admin', 'teacher'), conductController.createConductRecord);

module.exports = router;
