const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Vui lòng nhập tên',
        'string.empty': 'Tên không được để trống'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Vui lòng nhập email',
        'string.empty': 'Email không được để trống'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Vui lòng nhập mật khẩu',
        'string.empty': 'Mật khẩu không được để trống'
    }),
    role: Joi.string().valid('admin', 'teacher', 'student').default('student'),
    profile: Joi.object().optional(),
    studentDetails: Joi.object().optional(),
    teacherDetails: Joi.object().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Vui lòng nhập email',
        'string.empty': 'Email không được để trống'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Vui lòng nhập mật khẩu',
        'string.empty': 'Mật khẩu không được để trống'
    })
});

module.exports = { registerSchema, loginSchema };
