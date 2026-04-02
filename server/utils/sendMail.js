const User = require('../models/User')
const nodemailer = require('nodemailer');
exports.sendWaringEmail = async (studentId) => {
    const student = await User.findById(studentId)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        author: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });
    const mailOptions = {
        from: '"Hệ thống Edutrack" <noreply@edutrack.com',
        to: student.mail,
        subject: 'Cảnh báo: Vắng mặt không phép',
        text: `Chào ${student.name}, hệ thống ghi nhận bạn vắng mặt không phép trong buổi học hôm nay. Vui lòng liên hệ giáo viên!`
    }
    await transporter.sendMail(mailOptions)
}