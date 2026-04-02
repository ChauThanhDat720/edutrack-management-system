const Absence = require('../models/absenceRequest');
const User = require('../models/User')
/// desc create
/// router POST /api/Absence
exports.createAbsence = async (req, res) => {
    try {
        const { reason, date, status } = req.body;
        const absence = await Absence.create({
            student: req.user.id,
            reason,
            date,
            status
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
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Trạng thái không hợp lệ'
            })
        }
        if (req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Bạn không quyền truy cập'
            });
        }
        const absence = await Absence.findByIdAndUpdate(req.params.id,
            { status },
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
            message: error.messsage
        });

    }
}