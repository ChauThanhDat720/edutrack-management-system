const mongoose = require('mongoose');
const rescheduleRequestSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Session',
        require: true
    },
    requestedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        require: true
    },
    reason: {
        type: String,
        require: [true, 'Please add a reason']
    },
    newDate: {
        type: Date,
    },
    newRoom: {
        type: String,
        require: true
    },
    reviewedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        require: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    newStartTime: { type: String },
    newEndTime: { type: String },
    reviewNote: { type: String },
    newSessionId: { type: mongoose.Schema.ObjectId, ref: 'Session' }
}, { timestamps: true });

rescheduleRequestSchema.index({ requestedBy: 1, status: 1 });
rescheduleRequestSchema.index({ status: 1 });

module.exports = mongoose.model('RescheduleRequest', rescheduleRequestSchema);