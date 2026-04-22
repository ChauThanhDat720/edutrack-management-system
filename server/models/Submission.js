const mongoose = require('mongoose');
const SubmissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        require: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workFiles: [{
        url: String,
        name: String,
        type: { type: String, enum: ['file', 'link', 'drive'], default: 'file' },
        submittedAt: { type: Date, default: Date.now() }
    }],
    content: String,
    status: {
        type: String,
        enum: ['submitted', 'late', 'graded', 'returned'],
        default: 'submitted'
    },
    grade: { type: Number, min: 0, max: 10 },
    feedback: String,
}, { timestamps: true })
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model('Submission', SubmissionSchema)