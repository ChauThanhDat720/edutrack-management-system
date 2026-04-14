const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'absent'
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);