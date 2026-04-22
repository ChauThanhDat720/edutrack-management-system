const Submission = require('../models/Submission')
const Assignment = require('../models/Assignment')
const { sendToUser } = require('../config/socket')
exports.submitAssignment = async (req, res) => {
    const { assignmentId, fileUrl, fileName } = req.body;
    const studentId = req.user.id;

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Không tìm thấy bài tập" });

        const isLate = new Date() > new Date(assignment.dueDate);
        const status = isLate ? 'late' : 'submitted';
        const newAttachment = {
            url: fileUrl,
            name: fileName || (type === 'Link' ? 'Liên kết ngoài' : 'Bản nộp'),
            type: type || 'file',
            submitAt: new Date()
        }

        const submission = await Submission.findOneAndUpdate(
            { assignmentId, studentId },
            {
                $push: { workFiles: newAttachment },
                $set: { status: status }
            },
            { upsert: true, new: true }
        );

        sendToUser(assignment.teacherId, 'student_submitted', {
            studentName: req.user.name,
            assignmentTitle: assignment.title,
            status: status
        });

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