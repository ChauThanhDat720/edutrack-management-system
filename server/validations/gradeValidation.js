const Joi = require('joi');

const updateGradeSchema = Joi.object({
    studentId: Joi.string().required().messages({
        'any.required': 'Vui lòng chọn học sinh',
        'string.empty': 'ID học sinh không được để trống'
    }),
    subject: Joi.string().required().messages({
        'any.required': 'Vui lòng nhập tên môn học',
        'string.empty': 'Tên môn học không được để trống'
    }),
    term: Joi.string().valid('Semester 1', 'Semester 2').required().messages({
        'any.required': 'Vui lòng chọn học kỳ',
        'any.only': 'Học kỳ phải là Semester 1 hoặc Semester 2'
    }),
    oralGrade: Joi.number().min(0).max(10).optional().messages({
        'number.min': 'Điểm miệng không thấp hơn 0',
        'number.max': 'Điểm miệng không cao hơn 10',
        'number.base': 'Điểm miệng phải là một số'
    }),
    midtermGrade: Joi.number().min(0).max(10).optional().messages({
        'number.min': 'Điểm giữa kỳ không thấp hơn 0',
        'number.max': 'Điểm giữa kỳ không cao hơn 10',
        'number.base': 'Điểm giữa kỳ phải là một số'
    }),
    finalGrade: Joi.number().min(0).max(10).optional().messages({
        'number.min': 'Điểm cuối kỳ không thấp hơn 0',
        'number.max': 'Điểm cuối kỳ không cao hơn 10',
        'number.base': 'Điểm cuối kỳ phải là một số'
    })
});

module.exports = { updateGradeSchema };
