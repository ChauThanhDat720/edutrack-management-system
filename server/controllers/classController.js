const Class = require('../models/Class');
const User = require('../models/User');
const { generateSemester } = require('../services/sessionService');
// Helper: extract leading grade number from a className string
// e.g. '10A1' → 10, '11B2' → 11, 'A1' → null
const parseGrade = (className) => {
    const match = className.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

// @desc    Create a new class (auto-assigns matching unassigned students)
// @route   POST /api/classes
// @access  Admin

const moment = require('moment');

exports.createClass = async (req, res) => {
    try {
        const { className, teacher, room, schedule } = req.body;

        // 1. Kiểm tra tên lớp phải bắt đầu bằng số khối
        const grade = parseGrade(className);
        if (!grade) {
            return res.status(400).json({
                success: false,
                message: "Tên lớp phải bắt đầu bằng số khối (Ví dụ: 10A1, 11B2...)"
            });
        }

        // 2. Kiểm tra lớp tồn tại & Giáo viên hợp lệ
        const [classExists, teacherUser] = await Promise.all([
            Class.findOne({ className }),
            User.findOne({ _id: teacher, role: 'teacher' })
        ]);

        if (classExists) return res.status(400).json({ success: false, message: "Tên lớp đã tồn tại" });
        if (!teacherUser) return res.status(404).json({ success: false, message: "Giáo viên không hợp lệ" });

        // 3. Tìm học sinh có tên lớp trùng khớp và chưa được gán vào lớp nào
        const matchingStudents = await User.find({
            role: 'student',
            'studentDetails.className': className,
            'studentDetails.class': null
        });
        const studentIds = matchingStudents.map(s => s._id);

        // 4. Tạo lớp học
        const newClass = await Class.create({
            className,
            teacher,
            room,
            schedule,
            students: studentIds
        });

        // 5. Cập nhật dữ liệu liên quan (chạy song song)
        await Promise.all([
            // Gán class ObjectId cho các học sinh matching
            studentIds.length > 0 && User.updateMany(
                { _id: { $in: studentIds } },
                { $set: { 'studentDetails.class': newClass._id } }
            ),
            // Thêm lớp vào danh sách lớp của giáo viên
            User.findByIdAndUpdate(teacher, {
                $addToSet: { 'teacherDetails.assignedClasses': newClass._id }
            })
        ]);

        // 6. Tự động tạo Sessions cho 6 tháng tới
        const startDate = moment().startOf('day').toDate();
        const endDate = moment().add(6, 'months').endOf('day').toDate();
        const generatedSessions = await generateSemester(newClass, startDate, endDate);

        res.status(201).json({
            success: true,
            message: `Tạo lớp ${className} thành công. Đã gán ${studentIds.length} học sinh.`,
            data: {
                classId: newClass._id,
                totalStudents: studentIds.length,
                sessionsCount: generatedSessions?.length || 0
            }
        });

    } catch (error) {
        console.error("LỖI TẠO LỚP:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all classes with teacher info
// @route   GET /api/classes
// @access  Admin, Teacher
exports.getClasses = async (req, res) => {
    try {
        let query = {};

        // Phân quyền lọc dữ liệu
        if (req.user.role === 'teacher') {
            query = { teacher: req.user.id };
        } else if (req.user.role === 'student') {
            query = { students: req.user.id };
        }
        // Admin sẽ không bị lọc (query = {})

        const classes = await Class.find(query)
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

        // Update the student's User document to reference this class
        await User.findByIdAndUpdate(studentId, { $set: { 'studentDetails.class': classDoc._id } });

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
            await User.findByIdAndUpdate(studentId, { $set: { 'studentDetails.class': classDoc._id } });
        } else {
            // remove
            if (!alreadyIn) {
                return res.status(400).json({ success: false, message: 'Học sinh không có trong lớp này' });
            }
            classDoc.students = classDoc.students.filter(s => s.toString() !== studentId);
            await User.findByIdAndUpdate(studentId, { $set: { 'studentDetails.class': null } });
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

// @desc    Generate sessions for an existing class (for classes created before auto-generation)
// @route   POST /api/classes/:id/generate-sessions
// @access  Admin
exports.generateClassSessions = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }
        if (!classDoc.schedule || classDoc.schedule.length === 0) {
            return res.status(400).json({ success: false, message: 'Lớp học chưa có lịch học. Vui lòng cập nhật lịch trước.' });
        }

        const startDate = moment().startOf('day').toDate();
        const endDate = moment().add(6, 'months').endOf('day').toDate();
        const sessions = await generateSemester(classDoc, startDate, endDate);

        res.status(200).json({
            success: true,
            message: `Đã tạo ${sessions.length} buổi học cho lớp ${classDoc.className}.`,
            data: { sessionsGenerated: sessions.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

