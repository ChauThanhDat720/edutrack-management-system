const Comment = require('../models/comment');
const Confession = require('../models/confession');
const { sendNotification } = require('../utils/notificationHelper');
// @desc create comment
// route POST /api/v1/comment/:confessionId
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const confessionId = req.params.confessionId;
        const confession = Confession.findById(confessionId);
        if (!confession) {
            return res.satus(404).json({
                success: false,
                message: "Không tìm thấy confession"
            });
        };
        const comment = await Comment.create({
            confession: confessionId,
            author: req.user.id,
            content
        });
        res.status(201).json({
            success: true,
            data: comment
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    };
};
// @desc get comment
// route GET /api/v1/confession/confessionId
exports.getComment = async (req, res) => {
    try {
        const confessionId = req.params.confessionId;
        const comment = Comment.findById(confessionId)
            .populate('author', 'name')
            .sort('-createdAt')
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Hiện tại confession này không có comment'
            });
        };
        res.status(200).json({
            success: true,
            data: comment
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    };
};
// @desc delete comment
// @route DELETE /api/v1/comments/:id
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }
        if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bình luận này'
            });
        }
        await comment.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Đã xóa bình luận'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
