const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper')

exports.createAssignment = async (req, res) => {
    try {
        const newAssignment = new Assignment(req.body);
        await newAssignment.save();

        // Notify students in the class
        const students = await User.find({ classId: req.body.classId, role: 'student' });
        students.forEach(student => {
            sendNotification(student._id, 'new_assignment', {
                title: newAssignment.title,
                dueDate: newAssignment.dueDate,
                message: "Bạn có bài tập mới trong lớp!"
            });
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
        const assignments = await Assignment.find({ classId: req.params.classId })
            .sort({ createdAt: -1 });
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
