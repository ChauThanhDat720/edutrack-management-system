const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    targetRole: {
        type: String,
        enum: ['all', 'teacher', 'student'],
        default: 'all',
        required: true
    },
    attachments: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
