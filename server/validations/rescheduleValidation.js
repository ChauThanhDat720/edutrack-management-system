const Joi = require('joi');

const createRescheduleSchema = Joi.object({
    sessionId: Joi.string().required().messages({
        'any.required': 'Vui lòng chọn buổi học cần dời',
        'string.empty': 'Không tìm thấy ID buổi học'
    }),
    reason: Joi.string().min(5).required().messages({
        'string.min': 'Lý do dời lịch phải có ít nhất 5 ký tự',
        'any.required': 'Vui lòng cung cấp lý do dời lịch',
        'string.empty': 'Lý do không được để trống'
    }),
    newDate: Joi.date().greater('now').optional().messages({
        'date.greater': 'Ngày dời phải là một ngày trong tương lai',
        'date.base': 'Ngày dời lịch không hợp lệ'
    }),
    newStartTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
        'string.pattern.base': 'Giờ bắt đầu không đúng định dạng (HH:mm)',
    }),
    newEndTime: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
        'string.pattern.base': 'Giờ kết thúc không đúng định dạng (HH:mm)',
    }),
    newRoom: Joi.string().optional().messages({
        'string.empty': 'Phòng học không được để trống'
    })
});

module.exports = { createRescheduleSchema };
