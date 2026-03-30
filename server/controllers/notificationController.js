const Notification = require('../models/Notification');

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo' });
        }

        // Make sure user owns the notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Không có quyền' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};