const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String, // Ví dụ: 'TẠO', 'CÂP NHẬT', 'XÓA', 'DUYỆT', 'TỪ CHỐI'
        required: true
    },
    module: {
        type: String, // Ví dụ: 'ĐIỂM SỐ', 'NGƯỜI DÙNG', 'BUỔI HỌC', 'DỜI LỊCH'
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    details: {
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
        note: { type: String }
    },
    ipAddress: {
        type: String
    }
}, { timestamps: true });

// Đánh chỉ mục để tìm kiếm nhanh theo người dùng hoặc module
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ targetId: 1 });

activityLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
