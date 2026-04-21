const Conduct = require('../models/ConductRecord');
const User = require('../models/User')
// const { protect, authorize } = require('../middleware/authMiddleware')
exports.createConductRecord = async (req, res) => {
    try {
        const { studentId, type, content, pointAdjustment } = req.body;
        const recordedBy = req.user.id;
        const newRecord = new Conduct({
            studentId,
            type,
            content,
            pointAdjustment,
            recordedBy
        });
        await newRecord.save();

        const updateStudent = await User.findByIdAndUpdate(studentId,
            { $inc: { conductScore: pointAdjustment } },
            { new: true }
        );
        if (!updateStudent) {
            return res.status(201).json({
                success: false,
                message: "Không tìm thấy học sinh"
            })
        };
        res.status(201).json({
            success: true,
            record: newRecord,
            update: updateStudent.conductScore
        })
        socketIO.sendToUser(newRecord.studentId, 'new_conduct_record', {
            title: 'Thông báo hạnh kiểm',
            message: `Bạn vừa bị lập phiếu: ${newRecord.content}`,
            type: newRecord.type
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }

}

// @ get all conductRecords 
// @router /api/conduct
// access admin
exports.getAllConductRecord = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const options = {
            page: page,
            limit: limit,
            sort: { createAt: -1 },
            populate: [
                {
                    path: 'studentId',
                    select: 'name studentDetails',
                    populate: { path: 'studentDetails.class', select: 'className' }
                }
            ]
        }
        const result = await Conduct.paginate({}, options)
        res.status(200).json({
            success: true,
            data: result.docs,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage

        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
exports.getStudentConductRecord = async (req, res) => {
    try {
        const student = req.user.id;
        if (!student) {
            return res.status(404).json({
                success: true,
                message: 'Không tìm tháy học sinh'
            });
        }
        const conductRecord = await Conduct.find({ studentId: student }).lean();
        if (conductRecord.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'Hiện học sinh sinh chưa có đơn nào'
            });
        }
        res.status(200).json({
            success: true,
            data: conductRecord
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: `Lỗi hệ thống ${error.message}`
        })
    }
    // const student = await User.findById(req.user.id)
}