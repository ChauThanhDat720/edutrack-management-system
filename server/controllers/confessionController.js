const { configDotenv } = require('dotenv');
const Confession = require('../models/confession');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper');
// @desc Create new confession
// @ POST /api/confession
exports.createConfession = async (req, res) => {
    try {
        const { title, content } = req.body;
        let mediaData = [];

        if (req.files) {
            mediaData = req.files.map(file => ({
                url: file.path,
                public_id: file.filename,
                resource_type: file.mimetype.startsWith('video') ? 'video' : 'image'
            }));
        }

        const newConfession = await Confession.create({
            title,
            content,
            author: req.user.id,
            media: mediaData
        });

        res.status(201).json({ success: true, data: newConfession });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc Get all confession
// @route GET/api/confession
exports.getConfessions = async (req, res) => {
    try {
        const confession = await Confession.find({ status: 'approved' })
            .populate({
                path: 'author',
                select: 'name role'
            })
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: confession
        })

    } catch (error) {
        res.status(400).json({
            success: false, error: error.messsage
        })
    }
}
exports.updateConfession = async (req, res) => {
    try {
        let confession = await Confession.findById(req.params.id);
        if (!confession) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy confession'
            });
        }
        if (confession.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Bạn không có quyền cập nhật confession này'
            });
        }
        confession = await Confession.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate({
            path: 'author',
            select: 'name role'
        });
        res.status(200).json({
            success: false,
            data: confession
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}
// @desc Delete confession
// @route DELETE /api/confession/:id
exports.deleteConfession = async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id);
        if (!confession) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy confession'
            });
        }
        if (confession.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Bạn không có quyền xóa confession này'
            });
        }
        await confession.deleteOne();
        res.status(200).json({
            success: true,
            data: {}
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}
// @desc approve confession
// @route PUT /api/confession/:id
// access Admin
exports.approveConfession = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
        }
        if (req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Bạn không có quyền chi cập'
            })
        }
        const confession = await Confession.findByIdAndUpdate(req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!confession) {
            return res.status(404).json({ message: 'Không tìm thấy confession' });
        }
        res.status(200).json({
            success: true,
            data: confession
        });
        sendNotification(
            confession.author,
            req.user.id,
            `Thông báo mới: ${confession.title}`,
            `Chào bạn, có một thông báo mới trong hệ thống. Hãy kiểm tra ngay!`,
            'Confession'
        )

    } catch (error) {
        res.status(500).json({
            message: error.messsage
        });
    }
} 