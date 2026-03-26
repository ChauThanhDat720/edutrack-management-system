const Grade = require('../models/Grade');
const User = require('../models/User');
const Class = require('../models/Class')
// @desc    Nhập hoặc cập nhật điểm cho học sinh
// @route   POST /api/grades
exports.updateStudentGrade = async (req, res) => {
    try {
        const { studentId, subject, term, oralGrade, midtermGrade, finalGrade } = req.body;

        let grade = await Grade.findOne({ student: studentId, subject, term });

        if (grade) {
            grade.oralGrade = oralGrade;
            grade.midtermGrade = midtermGrade;
            grade.finalGrade = finalGrade;
            grade.lastUpdatedBy = req.user.id;
            await grade.save();
        } else {

            grade = await Grade.create({
                student: studentId,
                teacher: req.user.id,
                subject,
                term,
                oralGrade,
                midtermGrade,
                finalGrade
            });
        }

        res.status(200).json({ success: true, data: grade });
    } catch (error) {
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
                sucess: false,
                error: 'Học sinh chưa có điểm'
            });
        }
        res.status('200').json({
            sucess: true,
            data: grades
        });
    } catch (error) {
        return res.status('400').json({
            sucess: false,
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
            return res.status('404').json({
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
            return res.status('404').json({
                success: false,
                error: `Chưa có điểm môn ${subject} cho lớp này`
            });
        }
        res.status('200').json({
            success: true,
            className: currentClass.className,
            data: grades
        })

    } catch (error) {
        res.status(500).json({ success: false, error: error });
    }
}