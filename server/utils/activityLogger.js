const ActivityLog = require('../models/ActivityLog');

/**
 * Ghi nhật ký hoạt động vào Database
 * @param {Object} data - Dữ liệu log
 * @param {string} data.userId - ID người thực hiện
 * @param {string} data.action - Loại hành động (TẠO, CẬP NHẬT, XÓA, DUYỆT...)
 * @param {string} data.module - Module bị tác động (ĐIỂM SỐ, NGƯỜI DÙNG...)
 * @param {string} data.targetId - ID của bản ghi bị tác động
 * @param {string} data.description - Mô tả chi tiết bằng tiếng Việt
 * @param {Object} [data.details] - Chứa oldValue, newValue hoặc note
 * @param {string} [data.ipAddress] - Địa chỉ IP (tùy chọn)
 */
const logActivity = async ({ userId, action, module, targetId, description, details = {}, ipAddress = null }) => {
    try {
        await ActivityLog.create({
            user: userId,
            action,
            module,
            targetId,
            description,
            details,
            ipAddress
        });
    } catch (error) {
        console.error('Lỗi khi ghi Activity Log:', error.message);
        // Không throw lỗi để tránh làm gián đoạn logic chính của ứng dụng
    }
};

module.exports = { logActivity };
