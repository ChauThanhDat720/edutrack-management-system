const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Vui lòng nhập tên môn học']
    },
    term: {
        type: String,
        enum: ['Semester 1', 'Semester 2'],
        required: true
    },
    oralGrade: { type: Number, min: 0, max: 10 },
    midtermGrade: { type: Number, min: 0, max: 10 },
    finalGrade: { type: Number, min: 0, max: 10 },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Tự động tính điểm trung bình môn (Virtual property)
gradeSchema.virtual('averageGrade').get(function () {
    if (this.oralGrade && this.midtermGrade && this.finalGrade) {
        return (this.oralGrade + this.midtermGrade * 2 + this.finalGrade * 3) / 6;
    }
    return null;
});

gradeSchema.index({ student: 1, subject: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);