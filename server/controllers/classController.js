const Class = require('../models/Class');
const User = require('../models/User');
const Session = require('../models/Session');
const Curriculum = require('../models/Curriculum');
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
        const { className, teacher, teachers, room, schedule } = req.body;

        // Nếu client không gửi danh sách teachers, lấy teacher chủ nhiệm làm mặc định
        const classTeachers = (teachers && teachers.length > 0) ? teachers : [teacher];

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

        // Cập nhật: Kiểm tra tất cả giáo viên trong danh sách
        const validTeachers = await User.find({ _id: { $in: classTeachers }, role: 'teacher' });
        if (validTeachers.length !== classTeachers.length) {
            return res.status(404).json({ success: false, message: "Một hoặc nhiều giáo viên không hợp lệ" });
        }

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
            teachers: classTeachers,
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
            // Thêm lớp vào danh sách lớp của TẤT CẢ giáo viên
            User.updateMany(
                { _id: { $in: classTeachers } },
                { $addToSet: { 'teacherDetails.assignedClasses': newClass._id } }
            )
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
            // Hiển thị lớp nếu giáo viên nằm trong danh sách teachers
            query = { teachers: req.user.id };
        } else if (req.user.role === 'student') {
            query = { students: req.user.id };
        }
        // Admin sẽ không bị lọc (query = {})

        const classes = await Class.find(query)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('teachers', 'name email teacherDetails.subject')
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
            .populate('teachers', 'name email teacherDetails.subject')
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
        console.log(`DEBUG GET CLASS: ${req.params.id} | User: ${req.user.role}`);
        const classDoc = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('teachers', 'name email teacherDetails.subject')
            .populate('students', 'name email studentDetails.studentId');

        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        // Kiểm tra quyền xem chi tiết lớp (Student chỉ được xem lớp của mình)
        if (req.user.role === 'student' && req.user.studentDetails?.class?.toString() !== classDoc._id.toString()) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin lớp này' });
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

            if (!alreadyIn) {
                return res.status(400).json({ success: false, message: 'Học sinh không có trong lớp này' });
            }
            classDoc.students = classDoc.students.filter(s => s.toString() !== studentId);
            await User.findByIdAndUpdate(studentId, { $set: { 'studentDetails.class': null } });
        }

        await classDoc.save();

        const updated = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('teachers', 'name email teacherDetails.subject')
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
        
        if (req.body.teachers) {
            const newTeachers = req.body.teachers;
            const oldTeachers = classDoc.teachers.map(t => t.toString());
            classDoc.teachers = newTeachers;
            
            // Xóa assignedClasses ở những giáo viên bị xóa khỏi lớp
            const removedTeachers = oldTeachers.filter(id => !newTeachers.includes(id));
            if (removedTeachers.length > 0) {
                await User.updateMany(
                    { _id: { $in: removedTeachers } },
                    { $pull: { 'teacherDetails.assignedClasses': classDoc._id } }
                );
            }
            
            // Thêm assignedClasses cho những giáo viên mới
            const addedTeachers = newTeachers.filter(id => !oldTeachers.includes(id));
            if (addedTeachers.length > 0) {
                await User.updateMany(
                    { _id: { $in: addedTeachers } },
                    { $addToSet: { 'teacherDetails.assignedClasses': classDoc._id } }
                );
            }
        }

        await classDoc.save();

        const updated = await Class.findById(req.params.id)
            .populate('teacher', 'name email teacherDetails.subject')
            .populate('teachers', 'name email teacherDetails.subject')
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

// @desc    Auto-schedule classes
// @route   POST /api/classes/auto-schedule
// @access  Admin
exports.autoScheduleClasses = async (req, res) => {
    try {
        const classes = await Class.find();
        const teachers = await User.find({ role: 'teacher' });
        const curriculums = await Curriculum.find();

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timeSlots = [
            { startTime: '07:00', endTime: '07:45' }, // Tiết 1
            { startTime: '07:45', endTime: '08:30' }, // Tiết 2
            { startTime: '08:45', endTime: '09:30' }, // Tiết 3
            { startTime: '09:30', endTime: '10:15' }, // Tiết 4
            { startTime: '10:15', endTime: '11:00' }  // Tiết 5
        ];

        // Convert curriculums to a map: grade -> array of required subjects
        const curriculumMap = new Map();
        curriculums.forEach(c => {
            const subjectsList = [];
            c.subjects.forEach(sub => {
                for (let i = 0; i < sub.sessionsPerWeek; i++) {
                    subjectsList.push(sub.name);
                }
            });
            curriculumMap.set(c.grade, subjectsList);
        });

        // Track teacher assignments to respect maxClasses
        const teacherAssignedClasses = new Map();
        teachers.forEach(t => teacherAssignedClasses.set(t._id.toString(), new Set(t.teacherDetails?.assignedClasses?.map(c => c.toString()) || [])));

        // Track teacher schedule to avoid time overlap
        const teacherSchedule = new Map();
        teachers.forEach(t => teacherSchedule.set(t._id.toString(), []));

        let updatedClassesCount = 0;

        for (const classDoc of classes) {
            const grade = parseGrade(classDoc.className);
            const classSchedule = [];
            const classTeachers = new Set();
            if (classDoc.teacher) classTeachers.add(classDoc.teacher.toString());

            const requiredSubjects = curriculumMap.get(grade) ? [...curriculumMap.get(grade)] : [];
            let fallbackMode = requiredSubjects.length === 0;
            let sessionCount = 0;

            for (const day of daysOfWeek) {
                for (const slot of timeSlots) {
                    if (fallbackMode && sessionCount >= 30) break;
                    if (!fallbackMode && requiredSubjects.length === 0) break;

                    let assignedSubjectIndex = -1;
                    let availableTeacher = null;

                    const findTeacherForSubject = (subj) => {
                        return teachers.find(t => {
                            const tId = t._id.toString();
                            
                            // Check subject match if not fallback
                            if (subj) {
                                if (!t.teacherDetails?.subject || t.teacherDetails.subject.toLowerCase() !== subj.toLowerCase()) {
                                    return false;
                                }
                            }

                            // Check allowedGrades
                            const allowedGrades = t.teacherDetails?.allowedGrades || [];
                            if (allowedGrades.length > 0 && !allowedGrades.includes(grade)) return false;

                            // Check maxClasses
                            const maxClasses = t.teacherDetails?.maxClasses || 2;
                            const assignedSet = teacherAssignedClasses.get(tId);
                            if (!assignedSet.has(classDoc._id.toString()) && assignedSet.size >= maxClasses) return false;

                            // Check time overlap
                            const schedule = teacherSchedule.get(tId);
                            const isOverlap = schedule.some(s => s.day === day && s.startTime === slot.startTime);
                            if (isOverlap) return false;

                            return true;
                        });
                    };

                    if (!fallbackMode) {
                        for (let i = 0; i < requiredSubjects.length; i++) {
                            const subj = requiredSubjects[i];
                            availableTeacher = findTeacherForSubject(subj);
                            if (availableTeacher) {
                                assignedSubjectIndex = i;
                                break;
                            }
                        }
                    } else {
                        availableTeacher = findTeacherForSubject(null);
                    }

                    if (availableTeacher) {
                        const tId = availableTeacher._id.toString();
                        
                        classSchedule.push({
                            dayOfWeek: day,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            teacher: tId
                        });

                        teacherAssignedClasses.get(tId).add(classDoc._id.toString());
                        teacherSchedule.get(tId).push({ day, startTime: slot.startTime });
                        classTeachers.add(tId);

                        sessionCount++;
                        if (!fallbackMode && assignedSubjectIndex !== -1) {
                            requiredSubjects.splice(assignedSubjectIndex, 1);
                        }
                    }
                }
            }

            if (classSchedule.length > 0) {
                classDoc.schedule = classSchedule;
                classDoc.teachers = Array.from(classTeachers);
                if (!classDoc.room) classDoc.room = `Phòng ${Math.floor(Math.random() * 20) + 101}`;
                await classDoc.save();
                updatedClassesCount++;
                
                await User.updateMany(
                    { _id: { $in: Array.from(classTeachers) } },
                    { $addToSet: { 'teacherDetails.assignedClasses': classDoc._id } }
                );
                
                // Xóa lịch cũ chưa học và sinh lịch mới 6 tháng
                await Session.deleteMany({ classId: classDoc._id, status: 'scheduled' });
                const startDate = moment().startOf('day').toDate();
                const endDate = moment().add(6, 'months').endOf('day').toDate();
                await generateSemester(classDoc, startDate, endDate);
            }
        }

        res.status(200).json({
            success: true,
            message: `Tự động xếp lịch thành công cho ${updatedClassesCount} lớp học.`,
            data: { updatedClassesCount }
        });

    } catch (error) {
        console.error("LỖI XẾP LỊCH TỰ ĐỘNG:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
