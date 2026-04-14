const Absence = require('../models/absenceRequest');
const User = require('../models/User');
const { authorize, protect } = require('../middleware/authMiddleware');
/// desc create
/// router POST /api/Absence
exports.createAbsence = async (req, res) => {
    try {
        const { reason, date, } = req.body;
        const absence = await Absence.create({
            student: req.user.id,
            reason,
            date,
        });
        res.status(200).json({
            success: true,
            data: absence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    };
}
// @desc approve Absence
// @router PUT /api/Absence/:id
exports.approveAbsence = async (req, res) => {
    try {
        const { status, note } = req.body;
        const absence = await Absence.findByIdAndUpdate(req.params.id,
            { status, note, approver: req.user.id },
            { new: true, runValidators: true }
        );
        if (!absence) {
            return res.status(404).json({
                message: 'Không có đơn xin phép nào'
            })
        }
        res.status(200).json({
            success: true,
            data: absence
        })


    } catch (error) {
        res.status(500).json({
            message: error.message
        });

    }
}
exports.responseAbsence = async (req, res) => {
    try {
        const { studentReply } = req.body;
        const absence = await Absence.findById(req.params.id);

        if (!absence) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn xin phép này'
            });
        }


        if (absence.student.toString() !== req.user.id) {
            return res.status(401).json({
                message: 'Bạn không có quyền phản hồi đơn này'
            });
        }


        if (absence.status !== 'rejected') {
            return res.status(400).json({
                message: 'Chỉ có thể phản hồi đơn đã bị từ chối'
            });
        }

        absence.studentReply = studentReply;
        absence.status = 'pending';
        absence.isAppealed = true;

        await absence.save();

        res.status(200).json({
            success: true,
            data: absence
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}
exports.getMyAbsences = async (req, res) => {

    try {
        const absence = await Absence.find({ student: req.user.id }).sort({ date: -1 })
        res.status(200).json({
            success: true,
            count: absence.length,
            data: absence
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Không thể truy suất danh sách vắng mặt'
        });
    }
}
exports.getAllAbsences = async (req, res) => {
    try {
        let query = {};
        if (req.query.date) {
            query.date = req.query.date;
        }
        if (req.query.status) {
            query.status = req.query.status
        }
        const absence = await Absence.find(query)
            .populate('student', 'name studentDetails.className')
            .sort({ date: -1 });
        res.status(200).json({ success: true, count: absence.length, data: absence });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
exports.deleteAbsence = async (req, res) => {
    try {
        const absence = await Absence.findById(req.params.id);
        if (!absence) {
            return res.status(404).json({ message: 'Không tìm thấy đơn' });
        }

        if (absence.student.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Không có quyền xóa' });
        }
        await absence.deleteOne();
        res.status(200).json({ success: true, message: 'Đã xóa đơn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}