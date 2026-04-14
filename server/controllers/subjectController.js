const Subject = require('../models/Subject');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: subjects.length, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Admin
exports.createSubject = async (req, res) => {
    try {
        const subject = await Subject.create(req.body);
        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
