const Session = require('../models/Session');
const RescheduleRequest = require('../models/RescheduleRequest');
const mongoose = require('mongoose');

// @desc    Giáo viên tạo đơn xin dời buổi dạy
// @route   POST /api/reschedule
// @access  Teacher
exports.createRescheduleRequest = async (req, res) => {
    try {
        const { sessionId, reason, newDate, newStartTime, newEndTime, newRoom } = req.body;
        const requestedBy = req.user.id;

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
        }
        if (session.teacher.toString() !== requestedBy) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền dời buổi học này' });
        }
        if (session.status !== 'scheduled') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể dời buổi học ở trạng thái đã lên lịch' });
        }
        const existing = await RescheduleRequest.findOne({ sessionId, status: 'pending' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Đã có đơn xin dời đang chờ duyệt cho buổi học này' });
        }
        if (newDate && new Date(newDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Ngày dời phải là ngày trong tương lai' });
        }
        const request = await RescheduleRequest.create({
            sessionId,
            requestedBy,
            reason,
            newDate,
            newStartTime,
            newEndTime,
            newRoom
        });
        const populated = await RescheduleRequest.findById(request._id)
            .populate('sessionId', 'date startTime endTime classId subject')
            .populate('requestedBy', 'name email');

        res.status(201).json({
            success: true,
            data: populated,
            message: 'Đơn xin dời buổi dạy đã được gửi thành công, đang chờ duyệt'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Giáo viên xem danh sách đơn của mình
// @route   GET /api/reschedule/my
// @access  Teacher
exports.getMyRescheduleRequests = async (req, res) => {
    try {
        const requestedBy = req.user.id;
        const { status } = req.query;

        const filter = { requestedBy };
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }

        const requests = await RescheduleRequest.find(filter)
            .populate({
                path: 'sessionId',
                select: 'date startTime endTime status',
                populate: [
                    { path: 'classId', select: 'className' },
                    { path: 'subject', select: 'name' }
                ]
            })
            .populate('reviewedBy', 'name')
            .populate('newSessionId', 'date startTime endTime')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin xem tất cả đơn xin dời
// @route   GET /api/reschedule
// @access  Admin
exports.getAllRescheduleRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, totalDocs] = await Promise.all([
            RescheduleRequest.find(filter)
                .populate({
                    path: 'sessionId',
                    select: 'date startTime endTime status',
                    populate: [
                        { path: 'classId', select: 'className' },
                        { path: 'subject', select: 'name' }
                    ]
                })
                .populate('requestedBy', 'name email')
                .populate('reviewedBy', 'name')
                .populate('newSessionId', 'date startTime endTime')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            RescheduleRequest.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalDocs / parseInt(limit));

        res.status(200).json({
            success: true,
            data: requests,
            totalDocs,
            totalPages,
            currentPage: parseInt(page),
            hasNextPage: parseInt(page) < totalPages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin duyệt đơn xin dời buổi dạy
// @route   PUT /api/reschedule/:id/approve
// @access  Admin
exports.approveRescheduleRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { reviewNote } = req.body;
        const reviewedBy = req.user.id;

        const request = await RescheduleRequest.findById(id).populate('sessionId').session(session);
        if (!request) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn xin dời' });
        }
        if (request.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Đơn này đã được xử lý trước đó' });
        }

        const oldSession = request.sessionId;
        if (!oldSession) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học gốc' });
        }

        // Tạo buổi học mới theo đề xuất
        const [newSession] = await Session.create([{
            classId: oldSession.classId?._id || oldSession.classId,
            subject: oldSession.subject?._id || oldSession.subject,
            teacher: oldSession.teacher?._id || oldSession.teacher,
            date: request.newDate || oldSession.date,
            startTime: request.newStartTime || oldSession.startTime,
            endTime: request.newEndTime || oldSession.endTime,
            room: request.newRoom || oldSession.room || null,
            status: 'scheduled'
        }], { session });

        // Đánh dấu buổi cũ là đã bị huỷ (dời)
        await Session.findByIdAndUpdate(oldSession._id, { status: 'cancelled' }, { session });

        // Cập nhật trạng thái đơn
        request.status = 'approved';
        request.reviewedBy = reviewedBy;
        request.reviewNote = reviewNote || '';
        request.newSessionId = newSession._id;
        await request.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populated = await RescheduleRequest.findById(request._id)
            .populate({ path: 'sessionId', select: 'date startTime endTime', populate: [{ path: 'classId', select: 'className' }, { path: 'subject', select: 'name' }] })
            .populate('requestedBy', 'name email')
            .populate('reviewedBy', 'name')
            .populate('newSessionId', 'date startTime endTime room');

        res.status(200).json({
            success: true,
            data: populated,
            message: 'Đã duyệt đơn xin dời và tạo buổi học mới thành công'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin từ chối đơn xin dời buổi dạy
// @route   PUT /api/reschedule/:id/reject
// @access  Admin
exports.rejectRescheduleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNote } = req.body;
        const reviewedBy = req.user.id;

        if (!reviewNote || reviewNote.trim() === '') {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
        }

        const request = await RescheduleRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn xin dời' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Đơn này đã được xử lý trước đó' });
        }

        request.status = 'rejected';
        request.reviewedBy = reviewedBy;
        request.reviewNote = reviewNote.trim();
        await request.save();

        const populated = await RescheduleRequest.findById(request._id)
            .populate({ path: 'sessionId', select: 'date startTime endTime', populate: [{ path: 'classId', select: 'className' }, { path: 'subject', select: 'name' }] })
            .populate('requestedBy', 'name email')
            .populate('reviewedBy', 'name');

        res.status(200).json({
            success: true,
            data: populated,
            message: 'Đã từ chối đơn xin dời buổi dạy'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};