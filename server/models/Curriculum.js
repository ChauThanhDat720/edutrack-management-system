const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
    grade: {
        type: Number,
        required: true,
        unique: true // Mỗi khối chỉ có 1 khung chương trình
    },
    subjects: [{
        name: {
            type: String,
            required: true
        },
        sessionsPerWeek: {
            type: Number,
            required: true,
            min: 1
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
