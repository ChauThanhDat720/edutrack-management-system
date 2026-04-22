const express = require('express');
const router = express.Router();
const uploadCloud = require('../middleware/cloudinaryMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, uploadCloud.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên' });
    }
    
    res.status(200).json({
        success: true,
        data: {
            url: req.file.path,
            name: req.file.originalname,
            size: req.file.size,
            format: req.file.format
        }
    });
});

module.exports = router;
