const Grade = require('../models/Grade');
const User = require('../models/User');
/// @desc Enter and Update grade for students
// @route POST/api/grades
exports.updateStudentGrade = async (req, res) => {
    try {
        const { studentId, subject, term, oralGrade, midtermGrade, finalGrade } = req.body;
        let grade = await Grade.findOne({ student: studentId, subject, term });
        if (grade) {
            grade.oralGrade = oralGrade;
            grade.midtermGrade = midtermGrade;
            grade.finalGrade = finalGrade;
            grade.lastUpdatedBy = req.user.id;
            await grade.save()
        }
    }
}