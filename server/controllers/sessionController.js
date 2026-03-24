const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
/// @desc Get all sessions
/// @route GET /api/sessions
/// @access Admin , Teacher
exports.getMySchedule = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const sessions = await Session.find({ teacher: teacherId })
            // populate classId with className and room
            .populate('classId', 'className room')
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

        const session = await Session.findById(sessionId).populate({
            path: 'classId',
            select: 'className room students',
            populate: {
                path: 'students',
                select: 'name email studentDetails.studentId'
            }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
        }

        res.status(200).json({
            success: true,
            data: {
                sessionInfo: {
                    date: session.date,
                    startTime: session.startTime,
                    className: session.classId.className
                },
                students: session.classId.students
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
            return res.status(400).json({ sucess: false, message: "Dữ liệu điểm danh không hợp lệ" });
        }
        const operations = attendanceData.map(item => ({
            updateOne: {
                fillter: { sessionId, studentId: item.studentId },
                update: { status: item.status },
                upsert: true
            }

        }));
        await Attendance.bulkWrite(operations)
        await Session.findByIdAndUpdate(sessionId, { status: 'completed' })
        res.status(200).json({ sucess: true, message: "Ghi nhận điểm danh thành công" })

    } catch (error) {
        res.status(500).json({ sucess: false, message: error.message })

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

        // 2. Truy vấn lịch học dựa trên classId đã tìm thấy
        const schedule = await Session.find({ classId: classId })
            .populate('teacher', 'name email')
            .populate('classId', 'className room')
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