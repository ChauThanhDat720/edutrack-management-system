const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// @desc    Proxy để xem file tránh lỗi CORS/Security
// @route   GET /api/files/view
router.get('/view', async (req, res) => {
    try {
        const { url } = req.query;
        console.log('DEBUG PROXY: Fetching URL:', url);

        if (!url) {
            return res.status(400).json({ message: 'Thiếu đường dẫn file' });
        }

        // Tải file từ Cloudinary
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        // Thiết lập các header cần thiết để trình duyệt hiểu đây là file gì
        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Pipe dữ liệu về client
        response.data.pipe(res);
    } catch (error) {
        console.error('File Proxy Error:', error.message);
        if (error.response) {
            console.error('Proxy Error Details:', error.response.status, error.response.statusText);
        }
        res.status(500).json({ message: 'Không thể tải file từ nguồn lưu trữ' });
    }
});

module.exports = router;
