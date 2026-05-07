const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper')

exports.createAssignment = async (req, res) => {
    try {
        const { classId } = req.body;

        // Check if teacher belongs to this class
        const isTeacherOfClass = req.user.teacherDetails?.assignedClasses?.some(
            cId => cId.toString() === classId.toString()
        );

        if (!isTeacherOfClass && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền giao bài tập cho lớp này'
            });
        }

        const newAssignment = new Assignment(req.body);
        await newAssignment.save();

        // Notify students in the class
        const students = await User.find({ 'studentDetails.class': req.body.classId, role: 'student' });
        students.forEach(student => {
            sendNotification(
                student._id, 
                req.user.id, 
                'Bài tập mới', 
                `Bạn có bài tập mới: ${newAssignment.title}`, 
                'ASSIGNMENT'
            );
        });

        res.status(201).json({
            success: true,
            data: newAssignment
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getAssignmentsByClass = async (req, res) => {
    try {
        const classId = req.params.classId;

        // IDOR Check
        if (req.user.role === 'student') {
            if (req.user.studentDetails?.class?.toString() !== classId) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bài tập của lớp này' });
            }
        } else if (req.user.role === 'teacher') {
            const isTeacherOfClass = req.user.teacherDetails?.assignedClasses?.some(
                cId => cId.toString() === classId
            );
            if (!isTeacherOfClass) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bài tập của lớp này' });
            }
        }

        const assignments = await Assignment.find({ classId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.deleteAssignment = async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa bài tập" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
