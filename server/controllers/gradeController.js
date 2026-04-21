const Grade = require('../models/Grade');
const User = require('../models/User');
const Class = require('../models/Class');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notificationHelper');
// @desc    Nhập hoặc cập nhật điểm cho học sinh
// @route   POST /api/grades
exports.updateStudentGrade = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { studentId, subject, term, oralGrade, midtermGrade, finalGrade } = req.body;

        let grade = await Grade.findOne({ student: studentId, subject, term }).session(session);

        if (grade) {
            grade.oralGrade = oralGrade;
            grade.midtermGrade = midtermGrade;
            grade.finalGrade = finalGrade;
            grade.lastUpdatedBy = req.user.id;
            await grade.save({ session });
        } else {
            const [newGrade] = await Grade.create([{
                student: studentId,
                teacher: req.user.id,
                subject,
                term,
                oralGrade,
                midtermGrade,
                finalGrade
            }], { session });
            grade = newGrade;
        }

        await session.commitTransaction();
        session.endSession();

        sendNotification(
            studentId,
            req.user.id,
            `Cập nhật điểm môn ${subject}`,
            `Chào bạn, giáo viên vừa cập nhật điểm ${term} cho bạn. Hãy kiểm tra ngay!`,
            'GRADE_UPDATE'
        );

        res.status(200).json({ success: true, data: grade });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, error: error.message });
    }
};
/// desc Get grades by studentId
/// @route GET/api/grades/:id
/// @access Student
exports.getGradesByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const grades = await Grade.find({ student: studentId })
            .populate('student', 'name studentDetails.studentId studentDetails.class')
            .populate('teacher', 'name')
        if (!grades || grades.length === 0) {
            return res.status('404').json({
                success: false,
                error: 'Học sinh chưa có điểm'
            });
        }
        res.status(200).json({
            success: true,
            data: grades
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error
        });
    }
}
/// desc Get grades for teacher by class
// @access teacher
exports.getGradesByTeacher = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subject } = req.query;
        const teacherId = req.user.id
        const currentClass = await Class.findById(classId)
        if (!currentClass) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy lớp học'
            });
        }
        const grades = await Grade.find({
            student: { $in: currentClass.students },
            teacher: teacherId,
            subject: subject
        })
            .populate('student', 'name mail studentDetails.studentId')
            .sort('student')
        if (!grades) {
            return res.status(404).json({
                success: false,
                error: `Chưa có điểm môn ${subject} cho lớp này`
            });
        }
        res.status(200).json({
            success: true,
            className: currentClass.className,
            data: grades
        })

    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
}