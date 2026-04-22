const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Lấy danh sách nhật ký hoạt động (Admin)
 * @route   GET /api/activity
 * @access  Admin
 */
exports.getActivityLogs = async (req, res) => {
    try {
        const { module, action, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (module) filter.module = module;
        if (action) filter.action = action;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: { path: 'user', select: 'name email role' }
        };

        const logs = await ActivityLog.paginate(filter, options);

        res.status(200).json({
            success: true,
            data: logs.docs,
            pagination: {
                totalDocs: logs.totalDocs,
                totalPages: logs.totalPages,
                currentPage: logs.page,
                hasNextPage: logs.hasNextPage,
                prevPage: logs.prevPage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
