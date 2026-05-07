const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { sendToUser } = require('../config/socket');
const { sendNotification } = require('../utils/notificationHelper');
exports.submitAssignment = async (req, res) => {
    const { assignmentId, fileUrl, fileName, type } = req.body;
    const studentId = req.user.id;

    try {
        const assignment = await Assignment.findById(assignmentId).populate('classId');
        if (!assignment) return res.status(404).json({ message: "Không tìm thấy bài tập" });

        const isLate = new Date() > new Date(assignment.dueDate);
        const status = isLate ? 'late' : 'submitted';
        const newAttachment = {
            url: fileUrl,
            name: fileName || (type === 'link' ? 'Liên kết ngoài' : 'Bản nộp'),
            type: type ? type.toLowerCase() : 'file',
            submittedAt: new Date()
        }

        const submission = await Submission.findOneAndUpdate(
            { assignmentId, studentId },
            {
                $push: { workFiles: newAttachment },
                $set: { status: status }
            },
            { upsert: true, new: true }
        );

        if (assignment.classId && assignment.classId.teacher) {
            sendToUser(assignment.classId.teacher, 'student_submitted', {
                studentName: req.user.name,
                assignmentTitle: assignment.title,
                status: status
            });
        }

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSubmissionsByAssignment = async (req, res) => {
    try {
        const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
            .populate('studentId', 'name email studentDetails');
        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.gradeSubmission = async (req, res) => {
    try {
        const { grade, feedback } = req.body;
        
        // Ownership check: Find submission and check if teacher teaches this class
        const submission = await Submission.findById(req.params.id).populate('assignmentId');
        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bản nộp' });
        }

        const isTeacherOfClass = req.user.teacherDetails?.assignedClasses?.some(
            cId => cId.toString() === submission.assignmentId.classId.toString()
        );

        if (!isTeacherOfClass && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chấm điểm cho lớp này' });
        }

        submission.grade = grade;
        submission.feedback = feedback;
        submission.status = 'graded';
        await submission.save();

        // Notify student
        sendNotification(
            submission.studentId,
            req.user.id,
            'Đã chấm điểm',
            `Bài tập "${submission.assignmentId.title}" của bạn đã được chấm điểm: ${grade}/10`,
            'GRADE'
        );

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getStudentSubmission = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            assignmentId: req.params.assignmentId,
            studentId: req.user.id
        });
        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}