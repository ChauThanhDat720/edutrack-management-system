const Announcement = require('../models/Announcement');

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (Admin only)
exports.createAnnouncement = async (req, res) => {
    try {
        // Add the logged-in user to req.body as the author
        req.body.author = req.user.id;

        const announcement = await Announcement.create(req.body);

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
        // You can also populate the author to get author's name and email
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
