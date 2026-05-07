const Curriculum = require('../models/Curriculum');

// @desc    Get all curriculums
// @route   GET /api/curriculums
// @access  Admin
exports.getCurriculums = async (req, res) => {
    try {
        const curriculums = await Curriculum.find().sort({ grade: 1 });
        res.status(200).json({ success: true, data: curriculums });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upsert a curriculum for a specific grade
// @route   POST /api/curriculums
// @access  Admin
exports.upsertCurriculum = async (req, res) => {
    try {
        const { grade, subjects } = req.body;

        if (!grade || !subjects) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp khối (grade) và danh sách môn (subjects)' });
        }

        let curriculum = await Curriculum.findOne({ grade });

        if (curriculum) {
            curriculum.subjects = subjects;
            await curriculum.save();
        } else {
            curriculum = await Curriculum.create({ grade, subjects });
        }

        res.status(200).json({ success: true, message: `Cập nhật thành công khung chương trình khối ${grade}`, data: curriculum });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
