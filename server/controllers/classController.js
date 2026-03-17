const Class = require('../models/Class');
const User = require('../models/User');

// Helper: extract leading grade number from a className string
// e.g. '10A1' → 10, '11B2' → 11, 'A1' → null
const parseGrade = (className) => {
    const match = className.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

// @desc    Create a new class (auto-assigns matching unassigned students)
// @route   POST /api/classes
// @access  Admin
const { generateSemester } = require('../services/sessionService'); // Đảm bảo import đúng
const moment = require('moment');

exports.createClass = async (req, res) => {
    try {
        const { className, teacher, room, schedule } = req.body;

        // 1. Tạo lớp học mới trong DB
        const newClass = await Class.create({ className, teacher, room, schedule });

        // 2. Tự động rải lịch dạy cho cả học kỳ (Ví dụ: 4 tháng kể từ hôm nay)
        // Bạn có thể tùy chỉnh ngày bắt đầu/kết thúc từ req.body nếu muốn
        const startDate = moment().startOf('day');
        const endDate = moment().add(4, 'months').endOf('month');

        const createdSessions = await generateSemester(newClass, startDate, endDate);

        // ── Auto-assign học sinh dựa trên khối (Grade) ────────────────────────
        const grade = parseGrade(className);
        let autoAssignedCount = 0;

        if (grade !== null) {
            // Tìm học sinh cùng khối và chưa có lớp
            const unassignedStudents = await User.find({
                role: 'student',
                'studentDetails.grade': grade,
                $or: [
                    { 'studentDetails.class': null },
                    { 'studentDetails.class': { $exists: false } }
                ]
            }).select('_id');

            if (unassignedStudents.length > 0) {
                const studentIds = unassignedStudents.map(s => s._id);

                // Cập nhật lớp cho học sinh
                await User.updateMany(
                    { _id: { $in: studentIds } },
                    { $set: { 'studentDetails.class': newClass._id } }
                );

                // Đưa ID học sinh vào mảng students của Class
                await Class.findByIdAndUpdate(newClass._id, {
                    $addToSet: { students: { $each: studentIds } }
                });

                autoAssignedCount = studentIds.length;
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Lấy dữ liệu lớp đã đầy đủ thông tin để trả về Client
        const populated = await Class.findById(newClass._id)
            .populate('teacher', 'name email role')
            .populate('students', 'name email studentDetails.studentId');

        res.status(201).json({
            success: true,
            message: `Tạo lớp thành công. Đã sinh ${createdSessions.length} buổi học và tự động xếp ${autoAssignedCount} học sinh vào lớp.`,
            data: populated
        });

    } catch (error) {
        console.error("Lỗi createClass:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
// @desc    Get all classes with teacher info
// @route   GET /api/classes
// @access  Admin, Teacher
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId');

        res.status(200).json({ success: true, count: classes.length, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a student to a class
// @route   PUT /api/classes/:id/add-student
// @access  Admin
exports.addStudent = async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp studentId' });
        }

        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        // Avoid duplicates
        if (classDoc.students.includes(studentId)) {
            return res.status(400).json({ success: false, message: 'Học sinh đã có trong lớp này' });
        }

        classDoc.students.push(studentId);
        await classDoc.save();

        // Return populated result
        const updated = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Admin, Teacher
exports.getClassById = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId studentDetails.grades');

        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        res.status(200).json({ success: true, data: classDoc });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Add or Remove a student from a class
// @route   PATCH /api/classes/:id/students
// @access  Admin
// Body: { studentId: "...", action: "add" | "remove" }
exports.manageStudents = async (req, res) => {
    try {
        const { studentId, action } = req.body;

        if (!studentId || !action) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp studentId và action (add/remove)' });
        }
        if (!['add', 'remove'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action phải là "add" hoặc "remove"' });
        }

        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        const alreadyIn = classDoc.students.map(s => s.toString()).includes(studentId);

        if (action === 'add') {
            if (alreadyIn) {
                return res.status(400).json({ success: false, message: 'Học sinh đã có trong lớp này' });
            }
            classDoc.students.push(studentId);
        } else {
            // remove
            if (!alreadyIn) {
                return res.status(400).json({ success: false, message: 'Học sinh không có trong lớp này' });
            }
            classDoc.students = classDoc.students.filter(s => s.toString() !== studentId);
        }

        await classDoc.save();

        const updated = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Admin
exports.updateClass = async (req, res) => {
    try {
        const { className, teacher, room, schedule } = req.body;

        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        // Update fields
        if (className) classDoc.className = className;
        if (teacher) classDoc.teacher = teacher;
        if (room) classDoc.room = room;
        if (schedule) classDoc.schedule = schedule;

        await classDoc.save();

        const updated = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
