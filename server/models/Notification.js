const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['GRADE_UPDATE', 'ATTENDANCE_ABSENT', 'SYSTEM', 'ANNOUNCEMENT', 'RESCHEDULE'],
        required: true
    },
    isRead: { type: Boolean, default: false },
    link: { type: String }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);