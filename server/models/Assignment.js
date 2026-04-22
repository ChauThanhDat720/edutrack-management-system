const mongoose = require('mongoose');
const assignmentSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    points: { type: Number, default: 100 },
    attachments: [{ url: String, name: String }],
    createdAt: { type: Date, default: Date.now },

}, { timestamps: true })
module.exports = mongoose.model('Assignment', assignmentSchema)  