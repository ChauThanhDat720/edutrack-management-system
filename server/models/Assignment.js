const mongoose = require('mongoose');
const assignmentSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: [true, 'Thiếu ID lớp học'] },
    title: { type: String, required: [true, 'Vui lòng nhập tiêu đề bài tập'] },
    description: String,
    dueDate: Date,
    points: { type: Number, default: 100 },
    attachments: [{ 
        url: String, 
        name: String,
        type: { type: String, enum: ['file', 'link', 'drive'], default: 'file' }
    }],
    createdAt: { type: Date, default: Date.now },

}, { timestamps: true })
module.exports = mongoose.model('Assignment', assignmentSchema)  