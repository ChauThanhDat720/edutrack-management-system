const Comment = require('../models/comment');
const Confession = require('../models/confession');
const { sendNotification } = require('../utils/notificationHelper');
const { broadcast } = require('../config/socket');
// @desc create comment
// route POST /api/v1/comment/:confessionId
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const confessionId = req.params.confessionId;
        const confession = await Confession.findById(confessionId);
        if (!confession) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy confession"
            });
        };
        const comment = await Comment.create({
            confession: confessionId,
            author: req.user.id,
            content
        });

        // Gửi thông báo cho tác giả bài viết
        if (confession.author && confession.author.toString() !== req.user.id.toString()) {
            await sendNotification(
                confession.author,
                req.user.id,
                'Bình luận mới',
                `Ai đó đã bình luận về bài viết của bạn.`,
                'comment'
            );
        }

        res.status(201).json({
            success: true,
            data: comment
        })

        // Broadcast comment count update or new comment
        broadcast('new_comment', {
            confessionId: confessionId,
            comment: comment
        });
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
        const comments = await Comment.find({ confession: confessionId })
            .populate('author', 'name')
            .sort('-createdAt');

        if (!comments || comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hiện tại confession này không có comment'
            });
        }
        res.status(200).json({
            success: true,
            data: comments
        });
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
