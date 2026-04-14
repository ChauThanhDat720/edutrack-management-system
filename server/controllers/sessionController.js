const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Absence = require('../models/absenceRequest');
/// @desc Get all sessions
/// @route GET /api/sessions
/// @access Admin , Teacher
exports.getMySchedule = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { startDate, endDate } = req.query;

        let query = { teacher: teacherId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sessions = await Session.find(query)
            .populate('classId', 'className room')
            .populate('subject', 'name code')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/// desc Get attendance of a session
/// @route GET /api/sessions/:id/attendance
/// @access Admin , Teacher
exports.getAttendanceSheet = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId)
            .populate({
                path: 'classId',
                select: 'className room students',
                populate: {
                    path: 'students',
                    select: 'name email studentDetails.studentId'
                }
            })
            .populate('subject', 'name code');

        if (!session) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
        }

        // Tìm các đơn xin nghỉ đã được duyệt cho ngày này
        const startDate = new Date(session.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(session.date);
        endDate.setHours(23, 59, 59, 999);

        const approvedAbsences = await Absence.find({
            date: { $gte: startDate, $lte: endDate },
            status: 'approved'
        });

        const attendanceRecords = await Attendance.find({ sessionId });

        const studentsWithAttendance = session.classId.students.map(student => {
            const studentObj = student.toObject();

            const absence = approvedAbsences.find(a => a.student.toString() === student._id.toString());
            if (absence) {
                studentObj.hasApprovedAbsence = true;
                studentObj.absenceReason = absence.reason;
                studentObj.absenceNote = absence.note;
            }

            const record = attendanceRecords.find(r => r.studentId.toString() === student._id.toString());
            studentObj.status = record ? record.status : 'present';

            return studentObj;
        });

        res.status(200).json({
            success: true,
            data: {
                sessionInfo: {
                    date: session.date,
                    startTime: session.startTime,
                    className: session.classId.className
                },
                students: studentsWithAttendance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/// desc Submit Attendance
/// @route POST /api/sessions/:id/attendance
/// @access Admin , Teacher
exports.submitAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { attendanceData } = req.body;
        if (!attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ success: false, message: "Dữ liệu điểm danh không hợp lệ" });
        }
        const operations = attendanceData.map(item => ({
            updateOne: {
                filter: { sessionId, studentId: item.studentId },
                update: { status: item.status },
                upsert: true
            }

        }));
        await Attendance.bulkWrite(operations)
        await Session.findByIdAndUpdate(sessionId, { status: 'completed' })
        res.status(200).json({ success: true, message: "Ghi nhận điểm danh thành công" })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })

    }
}
/// desc Get schedule of a student
/// @route GET /api/sessions/student/:studentId
/// @access student
// schedule.controller.js
exports.getStudentSchedule = async (req, res) => {
    try {
        const studentId = req.user.id;

        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        const classId = student.studentDetails?.class;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Học sinh hiện chưa được phân vào lớp nào. Vui lòng liên hệ Admin."
            });
        }

        const { startDate, endDate } = req.query;
        let query = { classId: classId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const schedule = await Session.find(query)
            .populate('teacher', 'name email')
            .populate('classId', 'className room')
            .populate('subject', 'name code')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            count: schedule.length,
            data: schedule
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Fetch all attendance records for this student
        const attendanceRecords = await Attendance.find({ studentId })
            .populate({
                path: 'sessionId',
                select: 'date startTime classId',
                populate: {
                    path: 'classId',
                    select: 'className'
                }
            })
            .sort({ createdAt: -1 });

        // Calculate statistics
        const stats = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            excused: attendanceRecords.filter(r => r.status === 'excused').length,
        };

        res.status(200).json({
            success: true,
            stats,
            data: attendanceRecords
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get available teachers for a time slot
// @route   GET /api/sessions/available-teachers
// @access  Admin, Teacher
exports.getAvailableTeachers = async (req, res) => {
    try {
        const { date, startTime, endTime, subjectId } = req.query;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp ngày, giờ bắt đầu và giờ kết thúc" });
        }

        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(sessionDate);
        nextDay.setDate(sessionDate.getDate() + 1);

        // Find busy sessions in this slot
        const busySessions = await Session.find({
            date: { $gte: sessionDate, $lt: nextDay },
            $or: [
                {
                    $and: [
                        { startTime: { $lte: startTime } },
                        { endTime: { $gt: startTime } }
                    ]
                },
                {
                    $and: [
                        { startTime: { $lt: endTime } },
                        { endTime: { $gte: endTime } }
                    ]
                },
                {
                    $and: [
                        { startTime: { $gte: startTime } },
                        { endTime: { $lte: endTime } }
                    ]
                }
            ]
        });

        const busyTeacherIds = busySessions.map(s => s.teacher.toString());

        // Find all teachers
        let teacherQuery = { role: 'teacher', _id: { $nin: busyTeacherIds } };

        // Optionally filter by subject if provided
        // For now, we return all available teachers
        const availableTeachers = await User.find(teacherQuery).select('name email teacherDetails');

        res.status(200).json({
            success: true,
            count: availableTeachers.length,
            data: availableTeachers
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Admin, Teacher
exports.createSession = async (req, res) => {
    try {
        const { classId, teacherId, subjectId, date, startTime, endTime } = req.body;

        // Validation
        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(sessionDate);
        nextDay.setDate(sessionDate.getDate() + 1);

        // Check teacher availability
        const teacherConflict = await Session.findOne({
            teacher: teacherId,
            date: { $gte: sessionDate, $lt: nextDay },
            $or: [
                { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
                { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
                { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
            ]
        });

        if (teacherConflict) {
            return res.status(400).json({ success: false, message: "Giáo viên này đã có lịch dạy trong khung giờ đã chọn" });
        }

        // Check class availability
        const classConflict = await Session.findOne({
            classId: classId,
            date: { $gte: sessionDate, $lt: nextDay },
            $or: [
                { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
                { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
                { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
            ]
        });

        if (classConflict) {
            return res.status(400).json({ success: false, message: "Lớp học này đã có lịch học trong khung giờ đã chọn" });
        }

        const session = await Session.create({
            classId,
            teacher: teacherId,
            subject: subjectId,
            date,
            startTime,
            endTime
        });

        res.status(201).json({ success: true, data: session });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all sessions for a specific class
// @route   GET /api/sessions/class/:classId
// @access  Admin, Teacher
exports.getSessionsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const sessions = await Session.find({ classId })
            .populate('subject', 'name code')
            .populate('teacher', 'name email')
            .sort({ date: -1, startTime: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};