const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper');

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (Admin only)
exports.createAnnouncement = async (req, res) => {
    try {
        req.body.author = req.user.id;

        const announcement = await Announcement.create(req.body);

        // Fetch users based on targetRole
        let query = {};
        if (announcement.targetRole === 'student') {
            query = { role: 'student' };
        } else if (announcement.targetRole === 'teacher') {
            query = { role: 'teacher' };
        }
        // If 'all', query stays empty {} to get all users

        const recipients = await User.find(query);

        // Send notifications to all recipients
        const notificationPromises = recipients.map(user =>
            sendNotification(
                user._id,
                req.user.id,
                `Thông báo mới: ${announcement.title}`,
                `Chào bạn, có một thông báo mới trong hệ thống. Hãy kiểm tra ngay!`,
                'ANNOUNCEMENT'
            )
        );

        // Run notification sending in background
        Promise.all(notificationPromises).catch(err => console.error('Lỗi gửi thông báo:', err));

        res.status(201).json({
            success: true,
            data: announcement
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public (or based on targetRole if needed, but per request everyone can see)
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate({
                path: 'author',
                select: 'name role'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
exports.getAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id).populate({
            path: 'author',
            select: 'name role'
        });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy thông báo'
            });
        }

        res.status(200).json({
            success: true,
            data: announcement
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        let announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy thông báo'
            });
        }

        // Only author OR admin can update
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Bạn không có quyền cập nhật thông báo này'
            });
        }

        announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate({
            path: 'author',
            select: 'name role'
        });

        res.status(200).json({
            success: true,
            data: announcement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
/// @desc Delete announcement
/// @route DELETE /api/announcements/:id
// @acess Private (Admin)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy thông báo để xóa'
            });
        }

        // Only author OR admin can delete
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: "Bạn không có quyền xóa thông báo này"
            });
        }

        await announcement.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};