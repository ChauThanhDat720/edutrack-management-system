const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subject name'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Please add a subject code'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: String
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
